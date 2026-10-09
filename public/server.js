const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint untuk Saavn API (agar tidak kena CORS)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const limit = req.query.limit || 30;
        if (!query) return res.json({ success: false, error: 'Query required' });

        const url = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`;
        const response = await axios.get(url, { timeout: 15000 });
        res.json(response.data);
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/lyrics', async (req, res) => {
    try {
        const { title, artist } = req.query;
        if (!title || !artist) return res.status(400).json({ error: 'required' });
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const response = await axios.get(url, { timeout: 10000 });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Lyrics not found' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'GOYZFY', version: '8.0.0' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🎵 GOYZFY v8.0 - SERVER RUNNING            ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  🌐 Buka di browser:                         ║`);
    console.log(`║     http://localhost:${PORT}                     ║`);
    console.log('║                                              ║');
    console.log('║  👤 Creator: Bumi (Agoy) - Tambun Utara     ║');
    console.log('║  ⚡ Status : READY                          ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
});