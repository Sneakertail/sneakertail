const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const transactions = [];

app.post('/api/payment/process', (req, res) => {
    const { userId, amount, items = [], type = 'checkout' } = req.body;
    const success = Math.random() > 0.1;

    if (!success) {
        return res.status(400).json({ status: 'FAILED', message: 'Payment declined' });
    }

    const transaction = {
        transactionId: `txn_${Date.now()}`,
        status: 'SUCCESS',
        userId,
        amount: Number(amount) || 0,
        type,
        items: Array.isArray(items) ? items : [],
        createdAt: new Date().toISOString(),
    };

    transactions.unshift(transaction);
    res.status(200).json(transaction);
});

app.get('/api/payment/admin/sales', (req, res) => {
    const totalRevenue = transactions.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
    const totalOrders = transactions.length;
    const totalItemsSold = transactions.reduce(
        (sum, transaction) => sum + transaction.items.reduce((itemSum, item) => itemSum + (Number(item.qty) || 0), 0),
        0
    );

    res.json({
        totalRevenue,
        totalOrders,
        totalItemsSold,
        transactions,
    });
});

app.listen(process.env.PORT || 3005, () => console.log('Payment service running'));
