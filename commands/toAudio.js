const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegStatic);

const SUPPORTED_TYPES = new Set([
  'videoMessage',
  'documentMessage', 
  'audioMessage',   
]);

const SUPPORTED_DOC_MIMES = new Set([
  'video/mp4',
  'video/x-matroska',
  'video/x-msvideo',
  'video/quicktime',
  'video/webm',
  'video/3gpp',
  'video/3gpp2',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
]);

async function downloadBuffer(sock, msg) {
  return downloadMediaMessage(
    msg,
    'buffer',
    {},
    {
      logger: console,
      reuploadRequest: sock.updateMediaMessage,
    }
  );
}


function bufferToTempFile(buffer, ext = 'tmp') {
  const tmpPath = path.join(os.tmpdir(), `megabot_${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

function convertToMp3(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.[^.]+$/, '') + '_out.mp3';

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioChannels(2)
      .audioFrequency(44100)
      .format('mp3')
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .on('end', () => {
        const buf = fs.readFileSync(outputPath);
        // Clean up temp bullshit
        try { fs.unlinkSync(inputPath); } catch (_) {}
        try { fs.unlinkSync(outputPath); } catch (_) {}
        resolve(buf);
      })
      .save(outputPath);
  });
}

function guessExtension(msg) {
  const type = Object.keys(msg.message || {})[0];

  if (type === 'videoMessage') return 'mp4';
  if (type === 'audioMessage') {
    const mimetype = msg.message.audioMessage?.mimetype || '';
    if (mimetype.includes('ogg')) return 'ogg';
    if (mimetype.includes('webm')) return 'webm';
    return 'mp3';
  }
  if (type === 'documentMessage') {
    const fileName = msg.message.documentMessage?.fileName || '';
    const ext = path.extname(fileName).replace('.', '').toLowerCase();
    if (ext) return ext;
    const mime = msg.message.documentMessage?.mimetype || '';
    const mimeExt = mime.split('/')[1]?.split(';')[0];
    return mimeExt || 'mp4';
  }
  return 'mp4';
}

async function toAudio(sock, msg, from) {
  //Resolve the quoted / direct media message
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const directMsg = msg.message;

  let targetMsg = msg;
  if (quoted) {
    const quotedType = Object.keys(quoted)[0];
    if (SUPPORTED_TYPES.has(quotedType)) {
      targetMsg = {
        key: msg.message.extendedTextMessage.contextInfo.stanzaId
          ? {
              remoteJid: from,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              fromMe: msg.message.extendedTextMessage.contextInfo.participant
                ? false
                : true,
            }
          : msg.key,
        message: quoted,
      };
    }
  }

  const msgType = Object.keys(targetMsg.message || {})[0];

  // Validate bullshit
  if (!SUPPORTED_TYPES.has(msgType)) {
    return sock.sendMessage(from, {
      text:
        '> MF  Please🙏 tag a *video*, *audio*, or *video document* with *.toaudio*.\n\n' +
        '_*Supported formats: MP4, MKV, AVI, MOV, WEBM, 3GP, OGG, MP3, AAC, WAV*_',
    }, { quoted: msg });
  }

  // Extra check for documentMessage bulshit
  if (msgType === 'documentMessage') {
    const mime = targetMsg.message.documentMessage?.mimetype || '';
    if (!SUPPORTED_DOC_MIMES.has(mime.split(';')[0].trim())) {
      return sock.sendMessage(from, {
        text: `> 💔 Unsupported document type: \`${mime}\`\n\nSupported video/audio formats only.`,
      }, { quoted: msg });
    }
  }

  

  let mediaBuffer;
  try {
    mediaBuffer = await downloadBuffer(sock, targetMsg);
  } catch (err) {
    console.error('[toAudio] Download error:', err);
    return sock.sendMessage(from, {
      text: '> Media It may have expired — try re-sending it.',
    }, { quoted: msg });
  }

  // Write to temp file & convert 
  const ext = guessExtension(targetMsg);
  const tmpIn = bufferToTempFile(mediaBuffer, ext);

  let audioBuffer;
  try {
    audioBuffer = await convertToMp3(tmpIn);
  } catch (err) {
    console.error('[toAudio] Conversion error:', err);
    //temp file bullshit cln
    try { fs.unlinkSync(tmpIn); } catch (_) {}
    return sock.sendMessage(from, {
      text: '> 💔 Conversion failed. Make sure the file contains a valid audio/video stream.',
    }, { quoted: msg });
  }

  try {
    await sock.sendMessage(from, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      ptt: false, 
    }, { quoted: msg });
  } catch (err) {
    console.error('[toAudio] Send error:', err);
    return sock.sendMessage(from, {
      text: '>  Bro Audio was converted but failed to send. Try again.',
    }, { quoted: msg });
  }
}

module.exports = toAudio;
