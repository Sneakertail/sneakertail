const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const carts = {};
const wishlists = {};

app.post('/api/cart/add', (req, res) => {
    const { userId, productId } = req.body;
    if (!carts[userId]) carts[userId] = [];
    carts[userId].push(productId);
    res.json({ message: 'Added to cart', cart: carts[userId] });
});

app.post('/api/wishlist/add', (req, res) => {
    const { userId, productId } = req.body;
    if (!wishlists[userId]) wishlists[userId] = [];
    wishlists[userId].push(productId);
    res.json({ message: 'Added to wishlist', wishlist: wishlists[userId] });
});

app.listen(process.env.PORT || 3004, () => console.log('Interaction service running'));
