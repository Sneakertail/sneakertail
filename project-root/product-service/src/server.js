const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const products = [
    { id: 1, name: "Air Jordan 1", price: 180, stock: 50 },
    { id: 2, name: "Yeezy 350", price: 220, stock: 0, raffleActive: true },
];

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products/admin/add', (req, res) => {
    products.push(req.body);
    res.status(201).json({ message: 'Product added' });
});

app.listen(process.env.PORT || 3002, () => console.log('Product service running'));
