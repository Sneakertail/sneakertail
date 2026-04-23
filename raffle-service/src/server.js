const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const app = express();

app.use(cors());
app.use(express.json());

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

app.post('/api/raffle/enter', async (req, res) => {
    const { userId, productId } = req.body;
    await redisClient.lPush(`raffle:${productId}`, String(userId));
    res.status(200).json({ message: 'Entered raffle queue successfully' });
});

app.get('/api/raffle/draw/:productId', async (req, res) => {
    const { productId } = req.params;
    const entries = await redisClient.lRange(`raffle:${productId}`, 0, -1);
    if (entries.length === 0) return res.json({ message: 'No entries' });
    const winner = entries[Math.floor(Math.random() * entries.length)];
    res.json({ winnerUserId: winner });
});

app.listen(process.env.PORT || 3003, () => console.log('Raffle service running'));
