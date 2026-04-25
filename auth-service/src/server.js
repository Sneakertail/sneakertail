const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.warn('JWT_SECRET is not set. Tokens will be signed with an unsafe development fallback.');
}

let nextId = 1;
const users = [];

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
    const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
    const [salt, hash] = storedHash.split(':');
    const candidate = hashPassword(password, salt).split(':')[1];
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
};

const createToken = (user) => {
    const payload = {
        userId: user.userId,
        username: user.username,
        role: user.role,
        iat: Date.now(),
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', jwtSecret || 'development-only-secret')
        .update(encodedPayload)
        .digest('base64url');
    return `${encodedPayload}.${signature}`;
};

const addSeedUser = ({ username, password, role, firstName, lastName, email }) => {
    if (!username || !password) return;
    users.push({
        userId: nextId++,
        username,
        passwordHash: hashPassword(password),
        role,
        firstName,
        lastName,
        email,
    });
};

addSeedUser({
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: process.env.ADMIN_EMAIL || 'admin@sneakertail.com',
});

addSeedUser({
    username: process.env.DEMO_USERNAME,
    password: process.env.DEMO_PASSWORD,
    role: 'user',
    firstName: 'Demo',
    lastName: 'User',
    email: process.env.DEMO_EMAIL || 'user@sneakertail.com',
});

app.post('/api/auth/register', (req, res) => {
    const { username, password, firstName, lastName, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
    }

    const newUser = {
        userId: nextId++,
        username,
        passwordHash: hashPassword(password),
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

    const user = users.find(u => u.username === username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
        token: createToken(user),
        role: user.role,
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    });
});

app.listen(process.env.PORT || 3001, () => console.log('Auth service running on port ' + (process.env.PORT || 3001)));
