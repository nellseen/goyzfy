const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const API_PROVIDERS = [
    {
        name: 'JioSaavn',
        url: 'https://www.jiosaavn.com/api.php',
        param: 'q',
        extraParams: {
            __call: 'search.getResults',
            _format: 'json',
            _marker: '0',
            p: '1',
            n: '30'
        }
    },
    {
        name: 'iTunes',
        url: 'https://itunes.apple.com/search',
        param: 'term',
        extraParams: {
            media: 'music',
            country: 'ID',
            limit: '30'
        }
    },
    {
        name: 'Deezer',
        url: 'https://api.deezer.com/search',
        param: 'q',
        extraParams: {
            limit: '30'
        }
    }
];

// DES Implementation (Pure JS) for decrypting JioSaavn media URLs
const DES_IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
const DES_FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
const DES_PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
const DES_PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
const DES_SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
const DES_E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
const DES_S_BOXES = [
  [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
  [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
  [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
  [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
  [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
  [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
  [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
  [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]
];
const DES_P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];

function desGetBits(buf) {
  const bits = [];
  for (let i = 0; i < buf.length; i++) {
    for (let b = 7; b >= 0; b--) bits.push((buf[i] >> b) & 1);
  }
  return bits;
}
function desBitsToBuf(bits) {
  const buf = Buffer.alloc(bits.length / 8);
  for (let i = 0; i < buf.length; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
    buf[i] = byte;
  }
  return buf;
}
function desPermute(bits, table) { return table.map(pos => bits[pos - 1]); }
function desGenerateKeys(keyBuf) {
  const keyBits = desPermute(desGetBits(keyBuf), DES_PC1);
  let C = keyBits.slice(0, 28), D = keyBits.slice(28, 56);
  const subKeys = [];
  for (let r = 0; r < 16; r++) {
    const s = DES_SHIFTS[r];
    C = C.slice(s).concat(C.slice(0, s));
    D = D.slice(s).concat(D.slice(0, s));
    subKeys.push(desPermute(C.concat(D), DES_PC2));
  }
  return subKeys;
}
function desFeistel(R, K) {
  const expanded = desPermute(R, DES_E);
  const xored = expanded.map((b, i) => b ^ K[i]);
  const sOutput = [];
  for (let i = 0; i < 8; i++) {
    const chunk = xored.slice(i * 6, (i + 1) * 6);
    const row = (chunk[0] << 1) | chunk[5];
    const col = (chunk[1] << 3) | (chunk[2] << 2) | (chunk[3] << 1) | chunk[4];
    const val = DES_S_BOXES[i][row * 16 + col];
    for (let b = 3; b >= 0; b--) sOutput.push((val >> b) & 1);
  }
  return desPermute(sOutput, DES_P);
}
function desDecryptBlock(blockBuf, subKeys) {
  const bits = desPermute(desGetBits(blockBuf), DES_IP);
  let L = bits.slice(0, 32), R = bits.slice(32, 64);
  for (let r = 15; r >= 0; r--) {
    const f = desFeistel(R, subKeys[r]);
    const nextR = L.map((b, i) => b ^ f[i]);
    L = R; R = nextR;
  }
  return desBitsToBuf(desPermute(R.concat(L), DES_FP));
}
function desDecryptUrl(base64Str, keyStr = '38346591') {
  try {
    const cipherBuf = Buffer.from(base64Str, 'base64');
    const keyBuf = Buffer.from(keyStr, 'utf8');
    const subKeys = desGenerateKeys(keyBuf);
    const outBlocks = [];
    for (let i = 0; i < cipherBuf.length; i += 8) {
      const block = cipherBuf.slice(i, i + 8);
      outBlocks.push(desDecryptBlock(block, subKeys));
    }
    const result = Buffer.concat(outBlocks);
    const pad = result[result.length - 1];
    const unpadded = (pad > 0 && pad <= 8) ? result.slice(0, result.length - pad) : result;
    return unpadded.toString('utf8');
  } catch (e) {
    return null;
  }
}

function decodeHTML(str) {
    if (!str || typeof str !== 'string') return str || '';
    return str
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'");
}

function extractResults(data) {
    if (!data || typeof data !== 'object') return null;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data?.results)) return data.data.results;
    if (Array.isArray(data.data)) return data.data;
    if (data.status === true && Array.isArray(data.results)) return data.results;
    return null;
}

function getDownloadUrls(item) {
    // 1. Direct verified audio URL from decrypted media URL
    if (item.audio_direct) {
        const u320 = item.audio_direct.replace(/_[0-9]+\.mp4$/, '_320.mp4');
        const u160 = item.audio_direct.replace(/_[0-9]+\.mp4$/, '_160.mp4');
        const u96 = item.audio_direct.replace(/_[0-9]+\.mp4$/, '_96.mp4');
        return [
            { quality: '96kbps', url: u96 },
            { quality: '160kbps', url: u160 },
            { quality: '320kbps', url: u320 },
            { quality: '320kbps', url: u320 },
            { quality: '320kbps', url: u320 }
        ];
    }

    // 2. Direct audio URL from decrypted media_urls
    if (item.media_urls && typeof item.media_urls === 'object') {
        const u96 = item.media_urls['96_KBPS'] || item.media_urls['96kbps'] || '';
        const u160 = item.media_urls['160_KBPS'] || item.media_urls['160kbps'] || '';
        const u320 = item.media_urls['320_KBPS'] || item.media_urls['320kbps'] || '';
        const list = [
            { quality: '96kbps', url: u96 || u160 || u320 },
            { quality: '160kbps', url: u160 || u320 || u96 },
            { quality: '320kbps', url: u320 || u160 || u96 },
            { quality: '320kbps', url: u320 || u160 || u96 },
            { quality: '320kbps', url: u320 || u160 || u96 }
        ].filter(d => d.url);
        if (list.length > 0) return list;
    }

    // 3. Fallback to iTunes previewUrl, Deezer preview, vlink, or media_url
    const single = item.previewUrl || item.preview || item.media_url || item.more_info?.media_url || item.more_info?.vlink || item.vlink || item.audio;
    if (single && typeof single === 'string' && single.startsWith('http')) {
        const streamUrl = single.includes('jiotunepreview.jio.com')
            ? `/api/stream?url=${encodeURIComponent(single)}`
            : single;
        return [
            { quality: '96kbps', url: streamUrl },
            { quality: '160kbps', url: streamUrl },
            { quality: '320kbps', url: streamUrl },
            { quality: '320kbps', url: streamUrl },
            { quality: '320kbps', url: streamUrl }
        ];
    }

    return [];
}

function normalizeSong(item) {
    if (!item || typeof item !== 'object') return null;

    const id = item.id ? String(item.id) : (item.trackId ? String(item.trackId) : (item.song_id ? String(item.song_id) : String(Math.random())));
    const rawTitle = item.name || item.title || item.song || item.trackName || 'Unknown';
    const title = decodeHTML(rawTitle);

    let artistName = 'Unknown';
    if (item.artists?.primary?.[0]?.name) {
        artistName = item.artists.primary[0].name;
    } else if (item.artist?.name) {
        artistName = item.artist.name;
    } else if (item.artistName) {
        artistName = item.artistName;
    } else if (item.more_info?.singers) {
        artistName = item.more_info.singers;
    } else if (item.primary_artists) {
        artistName = item.primary_artists;
    } else if (item.singers) {
        artistName = item.singers;
    } else if (item.artist) {
        artistName = item.artist;
    } else if (item.description && item.description.includes('·')) {
        artistName = item.description.split('·')[1]?.trim() || 'Unknown';
    }
    artistName = decodeHTML(artistName);

    let images = [];
    if (item.artworkUrl100) {
        const big = item.artworkUrl100.replace(/100x100[a-z0-9\-]*\.jpg/i, '500x500bb.jpg');
        images = [
            { quality: '50x50', url: item.artworkUrl60 || item.artworkUrl100 },
            { quality: '150x150', url: item.artworkUrl100 },
            { quality: '500x500', url: big }
        ];
    } else if (item.album?.cover_big || item.album?.cover_medium) {
        images = [
            { quality: '50x50', url: item.album.cover_small || item.album.cover },
            { quality: '150x150', url: item.album.cover_medium || item.album.cover },
            { quality: '500x500', url: item.album.cover_big || item.album.cover_xl || item.album.cover }
        ];
    } else if (Array.isArray(item.image) && item.image.length > 0) {
        images = item.image.map(img => typeof img === 'string' ? { quality: '', url: img } : img);
    } else if (item.images && typeof item.images === 'object') {
        images = [
            { quality: '50x50', url: item.images['50x50'] || item.image || '' },
            { quality: '150x150', url: item.images['150x150'] || item.image || '' },
            { quality: '500x500', url: item.images['500x500'] || item.image || '' }
        ];
    } else if (typeof item.image === 'string' && item.image) {
        images = [
            { quality: '50x50', url: item.image },
            { quality: '150x150', url: item.image },
            { quality: '500x500', url: item.image }
        ];
    } else {
        images = [
            { quality: '500x500', url: '' }
        ];
    }

    const rawAlbum = typeof item.album === 'object' ? (item.album?.name || item.album?.title || '') : (item.collectionName || item.album || item.more_info?.album || '');
    const albumName = decodeHTML(rawAlbum);

    let duration = 0;
    if (typeof item.duration === 'number') {
        duration = item.duration;
    } else if (item.trackTimeMillis) {
        duration = Math.round(item.trackTimeMillis / 1000);
    } else if (typeof item.duration === 'string') {
        if (item.duration.includes(':')) {
            const parts = item.duration.split(':').map(Number);
            duration = parts.length === 2 ? parts[0] * 60 + parts[1] : Number(parts[0]) || 0;
        } else {
            duration = Number(item.duration) || 0;
        }
    } else if (item.more_info?.duration) {
        duration = Number(item.more_info.duration) || 0;
    }

    const downloadUrl = getDownloadUrls(item);

    return {
        id,
        name: title,
        title,
        album: { name: albumName },
        artists: {
            primary: [{ name: artistName }]
        },
        image: images,
        duration,
        downloadUrl
    };
}

// Endpoint streaming audio proxy untuk mengatasi kendala CORS pada audio player
app.get('/api/stream', async (req, res) => {
    try {
        const streamUrl = (req.query.url || '').trim();
        if (!streamUrl) {
            return res.status(400).json({ success: false, error: 'Query parameter "url" is required' });
        }

        const range = req.headers.range;
        const reqHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://www.jiosaavn.com/'
        };
        if (range) reqHeaders['Range'] = range;

        const response = await axios.get(streamUrl, {
            responseType: 'stream',
            headers: reqHeaders,
            validateStatus: status => (status >= 200 && status < 300) || status === 206,
            timeout: 15000
        });

        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Accept, Origin, Content-Type',
            'Content-Type': response.headers['content-type'] || 'audio/mpeg',
            'Accept-Ranges': 'bytes'
        });

        if (response.headers['content-range']) {
            res.set('Content-Range', response.headers['content-range']);
        }
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }

        res.status(response.status);
        response.data.pipe(res);

        req.on('close', () => {
            if (response.data && typeof response.data.destroy === 'function') {
                response.data.destroy();
            }
        });
    } catch (err) {
        console.error('[Stream Error]', err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Stream error', detail: err.message });
        }
    }
});

// Endpoint pencarian lagu dengan fallback provider dan penyiapan audio valid
app.get('/api/search', async (req, res) => {
    const query = (req.query.q || req.query.query || '').trim();
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter "q" or "query" is required' });
    }

    let finalResults = null;
    let lastErrorReason = null;

    for (let i = 0; i < API_PROVIDERS.length; i++) {
        const provider = API_PROVIDERS[i];
        console.log(`[Search] Provider ${i + 1}/${API_PROVIDERS.length} | Mencoba: ${provider.url} | Query: "${query}"`);

        try {
            const params = { [provider.param]: query, ...(provider.extraParams || {}) };
            const response = await axios.get(provider.url, {
                params,
                timeout: 8000,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                validateStatus: (status) => status >= 200 && status < 300
            });

            console.log(`[Search] Status HTTP provider ${provider.url}: ${response.status}`);

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Respons bukan JSON valid');
            }

            const rawList = extractResults(response.data);
            if (!rawList) {
                throw new Error('Struktur respons tidak sesuai (hasil tidak ditemukan)');
            }

            console.log(`[Search] Berhasil dari provider: ${provider.url} (${rawList.length} hasil mentah)`);

            // Decrypt langsung jika provider sudah menyediakan encrypted_media_url
            rawList.forEach(item => {
                if (item.encrypted_media_url && !item.audio_direct) {
                    const decrypted = desDecryptUrl(item.encrypted_media_url);
                    if (decrypted && decrypted.startsWith('http')) {
                        item.audio_direct = decrypted;
                    }
                }
            });

            // Dapatkan audio streaming valid via JioSaavn getDetails batch untuk yang belum punya audio
            const missingIds = rawList.filter(item => !item.audio_direct).map(item => item.id).filter(Boolean);
            if (missingIds.length > 0) {
                try {
                    const batchPids = missingIds.slice(0, 20).join(',');
                    const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${encodeURIComponent(batchPids)}`;
                    const detailRes = await axios.get(detailUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 3500
                    });

                    if (detailRes.data && typeof detailRes.data === 'object') {
                        rawList.forEach(item => {
                            const detail = detailRes.data[item.id];
                            if (detail) {
                                if (detail.encrypted_media_url) {
                                    const decrypted = desDecryptUrl(detail.encrypted_media_url);
                                    if (decrypted && decrypted.startsWith('http')) {
                                        item.audio_direct = decrypted;
                                    }
                                }
                                if (detail.vlink && !item.audio_direct) {
                                    item.vlink = detail.vlink;
                                }
                                if (detail.duration && !item.duration) {
                                    item.duration = detail.duration;
                                }
                            }
                        });
                    }
                } catch (batchErr) {
                    console.warn('[Search] Gagal batch details audio:', batchErr.message);
                }
            }

            const candidateResults = rawList.map(normalizeSong).filter(s => s && s.downloadUrl && s.downloadUrl.length > 0);
            if (candidateResults.length > 0) {
                finalResults = candidateResults;
                break;
            } else {
                console.log(`[Search] Provider ${provider.name || provider.url} tidak menghasilkan lagu dengan audio valid, mencoba provider berikutnya...`);
            }
        } catch (err) {
            let errorReason = err.message;
            if (err.code === 'ENOTFOUND') {
                errorReason = 'DNS ENOTFOUND (Domain tidak ditemukan)';
            } else if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
                errorReason = 'Request Timeout (Melebihi batas waktu)';
            } else if (err.response) {
                errorReason = `HTTP Error ${err.response.status} (${err.response.statusText || 'Error'})`;
            }
            console.warn(`[Search] Provider ${provider.url} gagal: ${errorReason}`);
            lastErrorReason = errorReason;
        }
    }

    if (finalResults !== null) {
        return res.json({
            success: true,
            data: {
                results: finalResults
            }
        });
    }

    console.error(`[Search] Semua provider gagal untuk query "${query}". Terakhir: ${lastErrorReason}`);
    return res.status(502).json({
        success: false,
        error: 'Semua provider pencarian gagal atau tidak tersedia.'
    });
});

app.get('/api/lyrics', async (req, res) => {
    try {
        const title = (req.query.title || '').trim();
        const artist = (req.query.artist || '').trim();
        if (!title || !artist) {
            return res.status(400).json({ success: false, error: 'Query parameters "title" and "artist" are required' });
        }
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const response = await axios.get(url, { timeout: 8000 });
        return res.json({ success: true, lyrics: response.data.lyrics || '' });
    } catch (err) {
        return res.status(err.response?.status === 404 ? 404 : 500).json({
            success: false,
            error: 'Lyrics not found'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'GOYZFY',
        version: '8.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Wildcard route untuk serving index.html (kompatibel Express v4 & Express v5 /*splat)
const sendIndexHtml = (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
};

try { app.get('/*splat', sendIndexHtml); } catch (e) {}
try { app.get('*', sendIndexHtml); } catch (e) {}

if (require.main === module && process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT && process.env.PORT !== '8080' ? process.env.PORT : 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║  🎵 GOYZFY v8.0 - SERVER RUNNING            ║');
        console.log('╠══════════════════════════════════════════════╣');
        console.log(`║  🌐 Buka di browser:                         ║`);
        console.log(`║     http://0.0.0.0:${PORT}                   ║`);
        console.log('║                                              ║');
        console.log('║  👤 Creator: Bumi (Agoy) - Tambun Utara     ║');
        console.log('║  ⚡ Status : READY                          ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
    });
}

module.exports = app;
