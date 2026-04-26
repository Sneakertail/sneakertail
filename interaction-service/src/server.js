const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage (keyed by userId)
const carts = {};
const wishlists = {};

// ─── CART ────────────────────────────────────────────────────────────────────

app.get('/api/cart/:userId', (req, res) => {
    const { userId } = req.params;
    res.json({ cart: carts[userId] || [] });
});

app.post('/api/cart/add', (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });
    if (!carts[userId]) carts[userId] = [];
    carts[userId].push(productId);
    res.json({ message: 'Added to cart', cart: carts[userId] });
});

app.post('/api/cart/remove', (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });
    if (!carts[userId]) return res.json({ cart: [] });
    // Remove only the first occurrence
    const idx = carts[userId].indexOf(productId);
    if (idx !== -1) carts[userId].splice(idx, 1);
    res.json({ message: 'Removed from cart', cart: carts[userId] });
});

app.post('/api/cart/clear', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    carts[userId] = [];
    res.json({ message: 'Cart cleared' });
});

// ─── WISHLIST ────────────────────────────────────────────────────────────────

app.get('/api/wishlist/:userId', (req, res) => {
    const { userId } = req.params;
    res.json({ wishlist: wishlists[userId] || [] });
});

app.post('/api/wishlist/add', (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });
    if (!wishlists[userId]) wishlists[userId] = [];
    // Avoid duplicates in wishlist
    if (!wishlists[userId].includes(productId)) {
        wishlists[userId].push(productId);
    }
    res.json({ message: 'Added to wishlist', wishlist: wishlists[userId] });
});

app.post('/api/wishlist/remove', (req, res) => {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });
    if (!wishlists[userId]) return res.json({ wishlist: [] });
    wishlists[userId] = wishlists[userId].filter(id => id !== productId);
    res.json({ message: 'Removed from wishlist', wishlist: wishlists[userId] });
});

app.listen(process.env.PORT || 3004, () => console.log('Interaction service running on port ' + (process.env.PORT || 3004)));
