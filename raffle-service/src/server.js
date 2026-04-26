const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const app = express();

app.use(cors());
app.use(express.json());

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

// Enter a raffle queue
app.post('/api/raffle/enter', async (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });

    // Check if already entered
    const entries = await redisClient.lRange(`raffle:${productId}`, 0, -1);
    if (entries.includes(String(userId))) {
        return res.status(409).json({ message: 'Already entered raffle for this product' });
    }

    await redisClient.lPush(`raffle:${productId}`, String(userId));
    res.status(200).json({ message: 'Entered raffle queue successfully' });
});

// Get all entries for a product raffle
app.get('/api/raffle/entries/:productId', async (req, res) => {
    const { productId } = req.params;
    const entries = await redisClient.lRange(`raffle:${productId}`, 0, -1);
    res.json({ productId, entries, count: entries.length });
});

// Check if a user has entered a specific raffle
app.get('/api/raffle/check/:productId/:userId', async (req, res) => {
    const { productId, userId } = req.params;
    const entries = await redisClient.lRange(`raffle:${productId}`, 0, -1);
    res.json({ entered: entries.includes(String(userId)) });
});

// Draw a winner
app.post('/api/raffle/draw/:productId', async (req, res) => {
    const { productId } = req.params;
    const entries = await redisClient.lRange(`raffle:${productId}`, 0, -1);
    if (entries.length === 0) return res.json({ message: 'No entries', winner: null });
    const winner = entries[Math.floor(Math.random() * entries.length)];
    // Store winner
    await redisClient.set(`raffle:winner:${productId}`, winner);
    res.json({ winnerUserId: winner, totalEntries: entries.length });
});

// Get winner for a product
app.get('/api/raffle/winner/:productId', async (req, res) => {
    const { productId } = req.params;
    const winner = await redisClient.get(`raffle:winner:${productId}`);
    res.json({ productId, winnerUserId: winner });
});

app.listen(process.env.PORT || 3003, () => console.log('Raffle service running on port ' + (process.env.PORT || 3003)));
