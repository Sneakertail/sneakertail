const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/payment/process', (req, res) => {
    const { userId, amount, paymentDetails } = req.body;
    // Mock payment gateway logic
    const success = Math.random() > 0.1;
    if (success) {
        res.status(200).json({ transactionId: `txn_${Date.now()}`, status: 'SUCCESS' });
    } else {
        res.status(400).json({ status: 'FAILED', message: 'Payment declined' });
    }
});

app.listen(process.env.PORT || 3005, () => console.log('Payment service running'));
