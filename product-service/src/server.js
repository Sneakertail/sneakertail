const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let products = [
    {
        id: 1,
        name: "Air Jordan 1 Retro High OG",
        brand: "Nike",
        price: 180,
        stock: 50,
        raffleActive: false,
        description: "The shoe that started it all. Classic Chicago colourway.",
        image: null,
        category: "Basketball"
    },
    {
        id: 2,
        name: "Yeezy Boost 350 V2",
        brand: "Adidas",
        price: 220,
        stock: 10,
        raffleActive: true,
        description: "Exclusive Yeezy Boost 350 V2 — enter the raffle for a chance to cop.",
        image: null,
        category: "Lifestyle"
    },
    {
        id: 3,
        name: "Nike Dunk Low Panda",
        brand: "Nike",
        price: 110,
        stock: 25,
        raffleActive: false,
        description: "Clean black and white colourway. A streetwear staple.",
        image: null,
        category: "Lifestyle"
    },
    {
        id: 4,
        name: "New Balance 550",
        brand: "New Balance",
        price: 130,
        stock: 30,
        raffleActive: false,
        description: "Retro basketball silhouette with premium leather upper.",
        image: null,
        category: "Basketball"
    },
    {
        id: 5,
        name: "Travis Scott x Jordan 1 Low",
        brand: "Nike",
        price: 950,
        stock: 5,
        raffleActive: true,
        description: "Cactus Jack collabs with Jordan Brand on this heat. Raffle only.",
        image: null,
        category: "Collaboration"
    },
    {
        id: 6,
        name: "Adidas Samba OG",
        brand: "Adidas",
        price: 100,
        stock: 60,
        raffleActive: false,
        description: "The iconic football-inspired Samba is back with a vengeance.",
        image: null,
        category: "Lifestyle"
    }
];

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

app.post('/api/products/admin/add', (req, res) => {
    const newProduct = {
        id: req.body.id || Date.now(),
        name: req.body.name || 'Unnamed Product',
        brand: req.body.brand || '',
        price: Number(req.body.price) || 0,
        stock: Number(req.body.stock) || 0,
        raffleActive: !!req.body.raffleActive,
        description: req.body.description || '',
        image: req.body.image || null,
        category: req.body.category || 'Lifestyle'
    };
    products.push(newProduct);
    res.status(201).json({ message: 'Product added', product: newProduct });
});

app.put('/api/products/admin/:id', (req, res) => {
    const idx = products.findIndex(p => p.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
    res.json({ message: 'Product updated', product: products[idx] });
});

app.delete('/api/products/admin/:id', (req, res) => {
    const idx = products.findIndex(p => p.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    const removed = products.splice(idx, 1);
    res.json({ message: 'Product deleted', product: removed[0] });
});

app.listen(process.env.PORT || 3002, () => console.log('Product service running on port ' + (process.env.PORT || 3002)));
