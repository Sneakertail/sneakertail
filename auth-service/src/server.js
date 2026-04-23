const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        return res.json({ token: 'admin-jwt-token', role: 'admin', userId: 1 });
    }
    if (username === 'user' && password === 'user') {
        return res.json({ token: 'user-jwt-token', role: 'user', userId: 2 });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/register', (req, res) => {
    res.status(201).json({ message: 'User registered' });
});

app.listen(process.env.PORT || 3001, () => console.log('Auth service running'));
