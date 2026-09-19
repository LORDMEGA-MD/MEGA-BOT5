const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*'
	}
};

const MAX_SONGS_PER_REQUEST = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tryRequest(getter, attempts = 3) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await getter();
		} catch (err) {
			lastError = err;
			if (attempt < attempts) {
				await new Promise(r => setTimeout(r, 1000 * attempt));
			}
		}
	}
	throw lastError;
}

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

/**
 * Parses raw command text into a list of individual song queries.
 * Supports separators: newline, "/", "&", "*"
 */
function parseSongQueries(text) {
	if (!text) return [];

	const parts = text
		.split(/[\n\/&\*]+/g)
		.map(s => s.trim())
		.filter(s => s.length > 0);

	return parts;
}

/**
 * Strips the command invocation word from a line.
 * Handles: .song, #song, !song, /song, song — with or without prefix, case-insensitive.
 */
function isCommandLine(line) {
	return /^[.!#\/]?songs?$/i.test(line.trim());
}

/**
 * Extracts song names tagged with #song in a message.
 * Supports:
 *   #song SongName
 *   #song SongName1 / SongName2
 *   Multiple #song tags in one message
 *
 * Returns { found: boolean, queries: string[] }
 * If found=true, caller must NOT read quoted message content.
 */
function extractHashtagSongs(text) {
	if (!text) return { found: false, queries: [] };

	// Match all occurrences of #song followed by content until next #song or end
	// e.g. "#song Alone" or "#song Sorry / Faded"
	const hashtagPattern = /#songs?\s+([^\#]+)/gi;
	const matches = [...text.matchAll(hashtagPattern)];

	if (!matches.length) return { found: false, queries: [] };

	const queries = [];
	for (const match of matches) {
		const content = match[1].trim();
		const parsed = parseSongQueries(content);
		queries.push(...parsed);
	}

	const unique = [...new Set(queries.filter(q => q.length > 0 && !isCommandLine(q)))];
	return { found: unique.length > 0, queries: unique };
}

/**
 * Extracts plain text from a quoted/replied-to message.
 * Handles conversation, extendedTextMessage, and captions on media messages.
 */
function getQuotedText(message) {
	const ctx = message.message?.extendedTextMessage?.contextInfo;
	const quoted = ctx?.quotedMessage;
	if (!quoted) return '';

	return (
		quoted.conversation ||
		quoted.extendedTextMessage?.text ||
		quoted.imageMessage?.caption ||
		quoted.videoMessage?.caption ||
		''
	).trim();
}

/**
 * Master text extraction.
 * Priority:
 *   1. If #song hashtag(s) found in the direct message → use ONLY those, ignore quoted.
 *   2. Otherwise → combine direct text + quoted text, strip command lines, dedup.
 *
 * Returns string[] of clean song queries.
 */
function resolveQueries(message) {
	const directText = (
		message.message?.conversation ||
		message.message?.extendedTextMessage?.text ||
		''
	).trim();

	// --- Check for #song hashtag mode first ---
	const hashtag = extractHashtagSongs(directText);
	if (hashtag.found) {
		// Hashtag explicitly lists songs — ignore quoted message entirely
		return hashtag.queries;
	}

	// --- Normal mode: direct text + optional quoted text ---
	const quotedText = getQuotedText(message);

	// Strip command word from direct text before combining
	const directLines = directText
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.length > 0 && !isCommandLine(l));

	const quotedLines = quotedText
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.length > 0 && !isCommandLine(l));

	const combined = [...directLines, ...quotedLines].join('\n').trim();

	// Dedup to prevent double-processing same songs from direct+quoted overlap
	const parsed = parseSongQueries(combined);
	return [...new Set(parsed.filter(q => q.length > 0))];
}

// ---------------------------------------------------------------------------
// Download source APIs
// ---------------------------------------------------------------------------

async function getEliteProTechDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.downloadURL) {
		return { download: res.data.downloadURL, title: res.data.title };
	}
	throw new Error('EliteProTech ytdown returned no download');
}

async function getYupraDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.data?.download_url) {
		return {
			download: res.data.data.download_url,
			title: res.data.data.title,
			thumbnail: res.data.data.thumbnail
		};
	}
	throw new Error('Yupra returned no download');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.dl) {
		return {
			download: res.data.dl,
			title: res.data.title,
			thumbnail: res.data.thumb
		};
	}
	throw new Error('Okatsu ytmp3 returned no download');
}

const API_METHODS = [
	{ name: 'EliteProTech', method: (url) => getEliteProTechDownloadByUrl(url) },
	{ name: 'Yupra',        method: (url) => getYupraDownloadByUrl(url)        },
	{ name: 'Okatsu',       method: (url) => getOkatsuDownloadByUrl(url)       }
];

// ---------------------------------------------------------------------------
// Resolve query → video object
// ---------------------------------------------------------------------------

async function resolveVideo(query) {
	if (query.includes('youtube.com') || query.includes('youtu.be')) {
		return { url: query, title: query };
	}

	const search = await tryRequest(() => yts(query), 2);
	if (!search?.videos?.length) return null;
	return search.videos[0];
}

// ---------------------------------------------------------------------------
// Download audio buffer — tries each API in sequence, arraybuffer then stream
// ---------------------------------------------------------------------------

async function downloadAudioBuffer(video) {
	for (const apiMethod of API_METHODS) {
		let audioData;
		try {
			audioData = await apiMethod.method(video.url);
		} catch (apiErr) {
			console.log(`[song] ${apiMethod.name} API failed: ${apiErr.message}`);
			continue;
		}

		const audioUrl = audioData.download || audioData.dl || audioData.url;
		if (!audioUrl) {
			console.log(`[song] ${apiMethod.name} returned no download URL, trying next...`);
			continue;
		}

		// Try arraybuffer first
		try {
			const audioResponse = await axios.get(audioUrl, {
				responseType: 'arraybuffer',
				timeout: 90000,
				maxContentLength: Infinity,
				maxBodyLength: Infinity,
				decompress: true,
				validateStatus: s => s >= 200 && s < 400,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': '*/*',
					'Accept-Encoding': 'identity'
				}
			});
			const buf = Buffer.from(audioResponse.data);
			if (buf?.length > 0) return { buffer: buf, audioData };
		} catch (downloadErr) {
			const statusCode = downloadErr.response?.status || downloadErr.status;
			if (statusCode === 451) {
				console.log(`[song] Download blocked (451) from ${apiMethod.name}, trying next...`);
				continue;
			}

			// Fallback: stream mode
			try {
				const audioResponse = await axios.get(audioUrl, {
					responseType: 'stream',
					timeout: 90000,
					maxContentLength: Infinity,
					maxBodyLength: Infinity,
					validateStatus: s => s >= 200 && s < 400,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
						'Accept': '*/*',
						'Accept-Encoding': 'identity'
					}
				});

				const chunks = [];
				let totalLength = 0;
				const MAX_BYTES = 100 * 1024 * 1024;

				await new Promise((resolve, reject) => {
					audioResponse.data.on('data', (c) => {
						totalLength += c.length;
						if (totalLength > MAX_BYTES) {
							audioResponse.data.destroy();
							reject(new Error('Audio stream exceeded size limit'));
							return;
						}
						chunks.push(c);
					});
					audioResponse.data.on('end', resolve);
					audioResponse.data.on('error', reject);
				});

				const buf = Buffer.concat(chunks);
				if (buf?.length > 0) return { buffer: buf, audioData };
			} catch (streamErr) {
				const streamStatusCode = streamErr.response?.status || streamErr.status;
				if (streamStatusCode === 451) {
					console.log(`[song] Stream blocked (451) from ${apiMethod.name}, trying next...`);
				} else {
					console.log(`[song] Stream failed from ${apiMethod.name}: ${streamErr.message}`);
				}
				continue;
			}
		}
	}

	return null;
}

// ---------------------------------------------------------------------------
// Detect format & convert to MP3 if necessary
// ---------------------------------------------------------------------------

async function normalizeToMp3(audioBuffer) {
	const firstBytes = audioBuffer.slice(0, 12);
	const hexSignature = firstBytes.toString('hex');

	let fileExtension = 'mp3';
	let detectedFormat = 'unknown';

	if (firstBytes.toString('ascii', 4, 8) === 'ftyp' || hexSignature.startsWith('000000')) {
		const ftypBox = audioBuffer.slice(4, 8).toString('ascii');
		if (ftypBox === 'ftyp') {
			detectedFormat = 'M4A/MP4';
			fileExtension = 'm4a';
		}
	} else if (
		audioBuffer.toString('ascii', 0, 3) === 'ID3' ||
		(audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)
	) {
		detectedFormat = 'MP3';
		fileExtension = 'mp3';
	} else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
		detectedFormat = 'OGG/Opus';
		fileExtension = 'ogg';
	} else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
		detectedFormat = 'WAV';
		fileExtension = 'wav';
	} else {
		detectedFormat = 'Unknown (defaulting to M4A)';
		fileExtension = 'm4a';
	}

	if (fileExtension === 'mp3') {
		return { buffer: audioBuffer, mimetype: 'audio/mpeg', extension: 'mp3', detectedFormat };
	}

	try {
		const converted = await toAudio(audioBuffer, fileExtension);
		if (!converted || converted.length === 0) throw new Error('Conversion returned empty buffer');
		return { buffer: converted, mimetype: 'audio/mpeg', extension: 'mp3', detectedFormat };
	} catch (convErr) {
		throw new Error(`Failed to convert ${detectedFormat} to MP3: ${convErr.message}`);
	}
}

// ---------------------------------------------------------------------------
// Cleanup stale temp files
// ---------------------------------------------------------------------------

function cleanupTempFiles() {
	try {
		const tempDir = path.join(__dirname, '../temp');
		if (!fs.existsSync(tempDir)) return;

		const now = Date.now();
		fs.readdirSync(tempDir).forEach(file => {
			const filePath = path.join(tempDir, file);
			try {
				const stats = fs.statSync(filePath);
				if (now - stats.mtimeMs > 10000) {
					if (file.endsWith('.mp3') || file.endsWith('.m4a') || /^\d+\.(mp3|m4a)$/.test(file)) {
						fs.unlinkSync(filePath);
					}
				}
			} catch (e) { /* ignore */ }
		});
	} catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Process a single song query
// ---------------------------------------------------------------------------

async function processSingleSong(sock, chatId, message, query, attempts = 2) {
	let lastError = 'Unknown error';

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const video = await resolveVideo(query);
			if (!video) {
				lastError = `No results found for "${query}"`;
				break; // no point retrying a search miss
			}

			const downloadResult = await downloadAudioBuffer(video);
			if (!downloadResult) {
				lastError = 'All download sources failed (unavailable or blocked).';
				if (attempt < attempts) { await sleep(1500 * attempt); continue; }
				break;
			}

			const { buffer: rawBuffer, audioData } = downloadResult;
			const normalized = await normalizeToMp3(rawBuffer);

			const titleSource = audioData.title || video.title || query || 'song';
			const safeTitle = titleSource.replace(/[^\w\s-]/g, '').trim() || 'song';

			await sock.sendMessage(chatId, {
				audio: normalized.buffer,
				mimetype: normalized.mimetype,
				fileName: `${safeTitle}.${normalized.extension}`,
				ptt: false
			}, { quoted: message });

			normalized.buffer = null;
			return { success: true, title: titleSource };
		} catch (err) {
			lastError = err.message || String(err);
			console.error(`[song] Attempt ${attempt} failed for "${query}": ${lastError}`);
			if (attempt < attempts) await sleep(1500 * attempt);
		}
	}

	return { success: false, error: lastError, title: query };
}

// ---------------------------------------------------------------------------
// Error message builder
// ---------------------------------------------------------------------------

function buildErrorMessage(rawError) {
	const err = rawError || '';
	if (err.includes('No results found'))          return '❌ No results found.';
	if (err.includes('blocked') || err.includes('451')) return '❌ Content unavailable (451). May be due to legal/regional restrictions.';
	if (err.includes('All download sources failed')) return '❌ All download sources failed. The content may be unavailable or blocked.';
	if (err.includes('size limit'))                return '❌ File too large to process.';
	return '❌ Failed to download song.';
}

// ---------------------------------------------------------------------------
// Main command entry point
// ---------------------------------------------------------------------------

async function songCommand(sock, chatId, message) {
	// Smart query resolution:
	// - #song tags → extract ONLY those songs, skip quoted message entirely
	// - Otherwise → combine direct text + quoted, strip command lines, dedup
	const queries = resolveQueries(message);

	if (!queries.length) {
		await sock.sendMessage(chatId, {
			text: 'Usage: .song <song name or YouTube link>\n' +
			      'Multiple songs: separate with new line, "/", "&", or "*"\n' +
			      'Tag mode: #song SongName (ignores replied message content)\n' +
			      'Reply mode: reply to any message containing song names with .song'
		}, { quoted: message });
		return;
	}

	if (queries.length > MAX_SONGS_PER_REQUEST) {
		await sock.sendMessage(chatId, {
			text: `> ⚠️ some respect MF, Too many songs (${queries.length}). Limit is ${MAX_SONGS_PER_REQUEST}.`
		}, { quoted: message });
		return;
	}

	// Single song — silent, no announcement
	if (queries.length === 1) {
		const result = await processSingleSong(sock, chatId, message, queries[0]);
		if (!result.success) {
			await sock.sendMessage(chatId, { text: buildErrorMessage(result.error) }, { quoted: message });
		}
		cleanupTempFiles();
		return;
	}

	// Multiple songs — announce AFTER dedup so count is always accurate
	await sock.sendMessage(chatId, {
		text: `> ${queries.length} 🗿??. *WHATEVER...*`
	}, { quoted: message });

	const failed = [];
	const succeeded = [];

	for (let i = 0; i < queries.length; i++) {
		const query = queries[i];
		const result = await processSingleSong(sock, chatId, message, query);

		if (result.success) {
			succeeded.push(result.title || query);
		} else {
			failed.push({ query, error: result.error });
			await sock.sendMessage(chatId, {
				text: `> ❌ (${i + 1}/${queries.length}) "${query}" — ${buildErrorMessage(result.error)}`
			}, { quoted: message });
		}

		cleanupTempFiles();

		if (i < queries.length - 1) await sleep(1200);
	}

	if (failed.length) {
		await sock.sendMessage(chatId, {
			text: `> ✅ Done. ${succeeded.length}/${queries.length} .... ${failed.length} failed.`
		}, { quoted: message });
	}

	cleanupTempFiles();
}

module.exports = songCommand;
