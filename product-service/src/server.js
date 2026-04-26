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
        soldCount: 0,
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
        soldCount: 0,
        raffleActive: true,
        description: "Exclusive Yeezy Boost 350 V2 - enter the raffle for a chance to cop.",
        image: null,
        category: "Lifestyle"
    },
    {
        id: 3,
        name: "Nike Dunk Low Panda",
        brand: "Nike",
        price: 110,
        stock: 25,
        soldCount: 0,
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
        soldCount: 0,
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
        soldCount: 0,
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
        soldCount: 0,
        raffleActive: false,
        description: "The iconic football-inspired Samba is back with a vengeance.",
        image: null,
        category: "Lifestyle"
    }
];

const normalizeProduct = (product) => ({
    ...product,
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    soldCount: Number(product.soldCount) || 0,
    raffleActive: !!product.raffleActive,
});

const buildPurchaseDetails = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return { errors: ['No items provided'], purchaseItems: [] };
    }

    const errors = [];
    const purchaseItems = [];

    items.forEach((item) => {
        const product = products.find((entry) => entry.id === Number(item.productId));
        const qty = Number(item.qty) || 0;

        if (!product) {
            errors.push(`Product ${item.productId} not found`);
            return;
        }

        if (product.raffleActive) {
            errors.push(`${product.name} is raffle-only and cannot be purchased directly`);
            return;
        }

        if (qty <= 0) {
            errors.push(`Invalid quantity for ${product.name}`);
            return;
        }

        if (product.stock < qty) {
            errors.push(`${product.name} only has ${product.stock} left`);
            return;
        }

        purchaseItems.push({ product, qty });
    });

    return { errors, purchaseItems };
};

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

app.post('/api/products/admin/add', (req, res) => {
    const newProduct = normalizeProduct({
        id: req.body.id || Date.now(),
        name: req.body.name || 'Unnamed Product',
        brand: req.body.brand || '',
        price: Number(req.body.price) || 0,
        stock: Number(req.body.stock) || 0,
        soldCount: Number(req.body.soldCount) || 0,
        raffleActive: !!req.body.raffleActive,
        description: req.body.description || '',
        image: req.body.image || null,
        category: req.body.category || 'Lifestyle'
    });
    products.push(newProduct);
    res.status(201).json({ message: 'Product added', product: newProduct });
});

app.put('/api/products/admin/:id', (req, res) => {
    const idx = products.findIndex(p => p.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    products[idx] = normalizeProduct({ ...products[idx], ...req.body, id: products[idx].id });
    res.json({ message: 'Product updated', product: products[idx] });
});

app.post('/api/products/validate-purchase', (req, res) => {
    const { items } = req.body;
    const { errors } = buildPurchaseDetails(items);

    if (errors.length > 0) {
        return res.status(400).json({ valid: false, errors });
    }

    res.json({ valid: true });
});

app.post('/api/products/purchase', (req, res) => {
    const { items } = req.body;
    const { errors, purchaseItems } = buildPurchaseDetails(items);

    if (errors.length > 0) {
        return res.status(400).json({ status: 'FAILED', errors });
    }

    purchaseItems.forEach(({ product, qty }) => {
        product.stock -= qty;
        product.soldCount = (Number(product.soldCount) || 0) + qty;
    });

    res.json({
        status: 'SUCCESS',
        items: purchaseItems.map(({ product, qty }) => ({
            productId: product.id,
            qty,
            stock: product.stock,
            soldCount: product.soldCount,
        })),
    });
});

app.delete('/api/products/admin/:id', (req, res) => {
    const idx = products.findIndex(p => p.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    const removed = products.splice(idx, 1);
    res.json({ message: 'Product deleted', product: removed[0] });
});

app.listen(process.env.PORT || 3002, () => console.log('Product service running on port ' + (process.env.PORT || 3002)));
