const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory user store with seeded demo accounts
let nextId = 3;
const users = [
    { userId: 1, username: 'admin', password: 'admin', role: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@sneakertail.com' },
    { userId: 2, username: 'user', password: 'user', role: 'user', firstName: 'Demo', lastName: 'User', email: 'user@sneakertail.com' },
];

app.post('/api/auth/register', (req, res) => {
    const { username, password, firstName, lastName, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 3) {
        return res.status(400).json({ error: 'Password must be at least 3 characters' });
    }

    // Check if username already exists
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
    }

    const newUser = {
        userId: nextId++,
        username,
        password,
        role: 'user',
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
    };
    users.push(newUser);

    console.log(`Registered new user: ${username} (id=${newUser.userId})`);

    res.status(201).json({ message: 'User registered successfully', userId: newUser.userId });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = `${user.role}-jwt-${user.userId}-${Date.now()}`;

    res.json({
        token,
        role: user.role,
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    });
});

app.listen(process.env.PORT || 3001, () => console.log('Auth service running on port ' + (process.env.PORT || 3001)));
