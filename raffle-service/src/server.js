const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const app = express();

app.use(cors());
app.use(express.json());

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

const entryKey = (productId) => `raffle:${productId}`;
const winnerKey = (productId) => `raffle:winner:${productId}`;

const getRaffleState = async (productId, userId) => {
    const entries = await redisClient.lRange(entryKey(productId), 0, -1);
    const winnerUserId = await redisClient.get(winnerKey(productId));

    return {
        productId: String(productId),
        entered: userId ? entries.includes(String(userId)) : false,
        raffleOver: winnerUserId !== null,
        winnerUserId,
        isWinner: userId ? String(winnerUserId) === String(userId) : false,
        totalEntries: entries.length,
    };
};

app.post('/api/raffle/enter', async (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });

    const winnerUserId = await redisClient.get(winnerKey(productId));
    if (winnerUserId) {
        return res.status(409).json({ message: 'Raffle is already closed', winnerUserId });
    }

    const entries = await redisClient.lRange(entryKey(productId), 0, -1);
    if (entries.includes(String(userId))) {
        return res.status(409).json({ message: 'Already entered raffle for this product' });
    }

    await redisClient.lPush(entryKey(productId), String(userId));
    res.status(200).json({ message: 'Entered raffle queue successfully' });
});

app.get('/api/raffle/entries/:productId', async (req, res) => {
    const { productId } = req.params;
    const entries = await redisClient.lRange(entryKey(productId), 0, -1);
    res.json({ productId, entries, count: entries.length });
});

app.get('/api/raffle/check/:productId/:userId', async (req, res) => {
    const { productId, userId } = req.params;
    const state = await getRaffleState(productId, userId);
    res.json({ entered: state.entered });
});

app.get('/api/raffle/status/:productId/:userId?', async (req, res) => {
    const { productId, userId } = req.params;
    const state = await getRaffleState(productId, userId);
    res.json(state);
});

app.post('/api/raffle/draw/:productId', async (req, res) => {
    const { productId } = req.params;
    const existingWinner = await redisClient.get(winnerKey(productId));

    if (existingWinner) {
        const entries = await redisClient.lRange(entryKey(productId), 0, -1);
        return res.json({ winnerUserId: existingWinner, totalEntries: entries.length });
    }

    const entries = await redisClient.lRange(entryKey(productId), 0, -1);
    if (entries.length === 0) return res.json({ message: 'No entries', winnerUserId: null, totalEntries: 0 });

    const winner = entries[Math.floor(Math.random() * entries.length)];
    await redisClient.set(winnerKey(productId), winner);
    res.json({ winnerUserId: winner, totalEntries: entries.length });
});

app.get('/api/raffle/winner/:productId', async (req, res) => {
    const { productId } = req.params;
    const winner = await redisClient.get(winnerKey(productId));
    res.json({ productId, winnerUserId: winner });
});

app.listen(process.env.PORT || 3003, () => console.log('Raffle service running on port ' + (process.env.PORT || 3003)));
