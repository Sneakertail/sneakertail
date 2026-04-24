import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUser, showToast }) {
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [loading, setLoading] = useState(false);
    const AUTH_API = process.env.REACT_APP_AUTH_API || 'http://localhost:3001/api/auth';
    const navigate = useNavigate();

    // Login fields
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirm, setRegConfirm] = useState('');
    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (!loginUsername || !loginPassword) { showToast('Please fill in all fields', 'error'); return; }
        setLoading(true);
        fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginUsername, password: loginPassword })
        })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    showToast(`Welcome back, ${data.firstName || data.username}! 👋`);
                    navigate('/');
                } else {
                    showToast(data.error || 'Invalid username or password', 'error');
                }
            })
            .catch(() => showToast('Connection error. Is the server running?', 'error'))
            .finally(() => setLoading(false));
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (!regUsername || !regPassword || !regFirstName || !regLastName || !regEmail) {
            showToast('Please fill in all required fields', 'error'); return;
        }
        if (regPassword !== regConfirm) {
            showToast('Passwords do not match', 'error'); return;
        }
        if (regPassword.length < 3) {
            showToast('Password must be at least 3 characters', 'error'); return;
        }
        setLoading(true);
        fetch(`${AUTH_API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: regUsername,
                password: regPassword,
                firstName: regFirstName,
                lastName: regLastName,
                email: regEmail,
            })
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (ok) {
                    showToast('Account created! Please sign in. ✅');
                    setTab('login');
                    setLoginUsername(regUsername);
                    setLoginPassword('');
                    // Clear register form
                    setRegUsername(''); setRegPassword(''); setRegConfirm('');
                    setRegFirstName(''); setRegLastName(''); setRegEmail('');
                } else {
                    showToast(data.error || 'Registration failed', 'error');
                }
            })
            .catch(() => showToast('Connection error. Is the server running?', 'error'))
            .finally(() => setLoading(false));
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: tab === 'register' ? 480 : 420 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👟</div>
                    <div className="auth-title">SNEAKERTAIL</div>
                    <div className="auth-sub">
                        {tab === 'login' ? 'Sign in to your account' : 'Create a new account'}
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login</button>
                    <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
                </div>

                {/* ─── LOGIN FORM ─── */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                className="form-input"
                                placeholder="Enter username"
                                value={loginUsername}
                                onChange={e => setLoginUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Enter password"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <div className="auth-hint" style={{ marginTop: 20 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Demo Credentials</div>
                            <div>User: <code>user</code> / <code>user</code></div>
                            <div style={{ marginTop: 4 }}>Admin: <code>admin</code> / <code>admin</code></div>
                        </div>
                    </form>
                )}

                {/* ─── REGISTER FORM ─── */}
                {tab === 'register' && (
                    <form onSubmit={handleRegister}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">First Name *</label>
                                <input
                                    className="form-input"
                                    placeholder="John"
                                    value={regFirstName}
                                    onChange={e => setRegFirstName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name *</label>
                                <input
                                    className="form-input"
                                    placeholder="Doe"
                                    value={regLastName}
                                    onChange={e => setRegLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="john@example.com"
                                value={regEmail}
                                onChange={e => setRegEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username *</label>
                            <input
                                className="form-input"
                                placeholder="Choose a username (min 3 chars)"
                                value={regUsername}
                                onChange={e => setRegUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="Min 3 characters"
                                    value={regPassword}
                                    onChange={e => setRegPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password *</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={regConfirm}
                                    onChange={e => setRegConfirm(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Link to="/" style={{ color: 'var(--text2)', fontSize: 13 }}>← Back to Shop</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
