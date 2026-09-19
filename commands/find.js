'use strict'

const fs                             = require('fs')
const path                           = require('path')
const { tmpdir }                     = require('os')
const { execFile }                   = require('child_process')
const { pipeline }                   = require('stream/promises')
const { Transform }                  = require('stream')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { Shazam }                     = require('node-shazam')

const shazam = new Shazam()

const MEDIA_TYPES = [
  { key: 'audioMessage', type: 'audio', ext: '.mp3' },
  { key: 'videoMessage', type: 'video', ext: '.mp4' },
]

const MAX_FILE_SIZE_MB    = 50
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const SHAZAM_TIMEOUT_MS   = 25_000
const FFMPEG_TIMEOUT_MS   = 90_000
const RETRY_DELAYS_MS     = [3000, 6000]
const MAX_ATTEMPTS        = 3

async function streamMediaToDisk(msgObj, outPath) {
  if (!msgObj) return null

  for (const { key, type, ext } of MEDIA_TYPES) {
    if (!msgObj[key]) continue

    const fileSize = msgObj[key]?.fileLength ? Number(msgObj[key].fileLength) : null
    if (fileSize && fileSize > MAX_FILE_SIZE_BYTES)
      throw new Error(`Media too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_FILE_SIZE_MB}MB`)

    const filePath = outPath || path.join(tmpdir(), `megabot_find_${Date.now()}${ext}`)

    try {
      const stream = await downloadContentFromMessage(msgObj[key], type)
      const writer = fs.createWriteStream(filePath)

      let bytesWritten = 0
      const sizeGuard = new Transform({
        transform(chunk, _enc, cb) {
          bytesWritten += chunk.length
          if (bytesWritten > MAX_FILE_SIZE_BYTES) {
            writer.destroy()
            return cb(new Error(`Stream exceeded ${MAX_FILE_SIZE_MB}MB limit mid-download`))
          }
          cb(null, chunk)
        }
      })

      await pipeline(stream, sizeGuard, writer)

      if (fs.statSync(filePath).size === 0) throw new Error('Downloaded file is empty')

      return { filePath, ext, type: key }
    } catch (e) {
      try { fs.unlinkSync(filePath) } catch (_) {}
      throw e
    }
  }

  return null
}

function extractAudioFromVideo(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(path.extname(inputPath), '.audio.mp3')
    const args = [
      '-y', '-i', inputPath,
      '-vn', '-acodec', 'libmp3lame',
      '-ar', '44100', '-ac', '2', '-b:a', '128k',
      '-t', '180',
      outputPath,
    ]
    execFile('ffmpeg', args, { timeout: FFMPEG_TIMEOUT_MS }, (err) => {
      if (err) return reject(new Error(`ffmpeg failed: ${err.message}`))
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0)
        return reject(new Error('ffmpeg produced an empty audio file'))
      resolve(outputPath)
    })
  })
}

async function recogniseWithRetry(filePath) {
  let lastErr = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[find] Shazam attempt ${attempt}/${MAX_ATTEMPTS}`)
      const result = await Promise.race([
        shazam.recognise(filePath, 'en-US'),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error('Shazam timeout')), SHAZAM_TIMEOUT_MS)
        ),
      ])
      if (result?.track) return result
      lastErr = new Error('No match in Shazam response')
    } catch (err) {
      lastErr = err
      console.warn(`[find] Attempt ${attempt} failed: ${err.message}`)
    }

    if (attempt < MAX_ATTEMPTS) {
      const wait = RETRY_DELAYS_MS[attempt - 1] ?? 6000
      console.log(`[find] Retrying in ${wait / 1000}s...`)
      await new Promise(r => setTimeout(r, wait))
    }
  }

  throw lastErr ?? new Error('All Shazam attempts exhausted')
}

function formatResult(track) {
  const song    = track.sections?.find(s => s.type === 'SONG')
  const title   = track.title         || 'Unknown'
  const artist  = track.subtitle      || 'Unknown'
  const album   = song?.metadata?.find(m => m.title === 'Album')?.text    || null
  const year    = song?.metadata?.find(m => m.title === 'Released')?.text || null
  const genre   = track.genres?.primary || null
  const spotify = track.hub?.providers
                    ?.find(p => p.type === 'SPOTIFY')
                    ?.actions?.[0]?.uri || null

  const lines = [`*${title}*`, `*Artist:* ${artist}`]
  if (album)   lines.push(`> *Album:* ${album}`)
  if (genre)   lines.push(`> *Genre:* ${genre}`)
  if (year)    lines.push(`> *Year:* ${year}`)
  if (spotify) lines.push(`\n> _*Spotify:* ${spotify}_`)

  return lines.join('\n')
}

function cleanReason(err) {
  const msg = err?.message || String(err)
  if (msg.includes('too large'))                  return msg
  if (msg.includes('exceeded'))                   return msg
  if (msg.includes('timeout'))                    return 'Shazam timed out — try a shorter or clearer clip'
  if (msg.includes('No match'))                   return 'Song not recognized — try a clearer or longer clip'
  if (msg.includes('ffmpeg'))                     return 'Could not extract audio from video'
  if (msg.includes('empty'))                      return 'Downloaded file was empty — media may be corrupted'
  if (/ENOTFOUND|ECONNRESET|network/i.test(msg))  return 'Network error reaching Shazam'
  if (msg.includes('All Shazam'))                 return 'All retry attempts exhausted without a match'
  return msg.slice(0, 120)
}

async function findCommand(sock, chatId, message) {
  const reply  = (text) => sock.sendMessage(chatId, { text }, { quoted: message })
  const direct = message.message
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null

  const tempPath = path.join(tmpdir(), `megabot_find_${Date.now()}.tmp`)
  let audioPath  = null

  try {
    let media = null

    try {
      media = await streamMediaToDisk(direct, tempPath)
    } catch (e) {
      if (e.message.includes('too large') || e.message.includes('exceeded'))
        return reply(`> ❌ ${e.message}`)
      throw e
    }

    if (!media && quoted) {
      try {
        media = await streamMediaToDisk(quoted, tempPath)
      } catch (e) {
        if (e.message.includes('too large') || e.message.includes('exceeded'))
          return reply(`> ❌ ${e.message}`)
        throw e
      }
    }

    if (!media) return reply('> Reply to or send an audio/video to use .find')

    audioPath = media.filePath

    if (media.type === 'videoMessage')
      audioPath = await extractAudioFromVideo(media.filePath)

    const result = await recogniseWithRetry(audioPath)
    await reply(formatResult(result.track))

  } catch (err) {
    console.error('[find] Error:', err.message)
    await reply(`> ❌ ${cleanReason(err)}`)
  } finally {
    if (audioPath && audioPath !== tempPath) try { fs.unlinkSync(audioPath) } catch (_) {}
    try { fs.unlinkSync(tempPath) } catch (_) {}
  }
}

module.exports = findCommand
