import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUser, showToast }) {
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const AUTH_API = process.env.REACT_APP_AUTH_API || 'http://localhost:3001/api/auth';
    const navigate = useNavigate();

    const submit = (e) => {
        e.preventDefault();
        if (!username || !password) { showToast('Please fill in all fields', 'error'); return; }
        setLoading(true);

        const endpoint = tab === 'login' ? `${AUTH_API}/login` : `${AUTH_API}/register`;

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (tab === 'login') {
                    if (data.token) {
                        setUser(data);
                        localStorage.setItem('user', JSON.stringify(data));
                        showToast(`Welcome back, ${data.role}! 👋`);
                        navigate('/');
                    } else {
                        showToast('Invalid username or password', 'error');
                    }
                } else {
                    showToast('Account created! Please login.');
                    setTab('login');
                }
            })
            .catch(() => showToast('Connection error. Is the server running?', 'error'))
            .finally(() => setLoading(false));
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
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

                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            className="form-input"
                            placeholder="Enter username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                {tab === 'login' && (
                    <div className="auth-hint" style={{ marginTop: 20 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Demo Credentials</div>
                        <div>User: <code>user</code> / <code>user</code></div>
                        <div style={{ marginTop: 4 }}>Admin: <code>admin</code> / <code>admin</code></div>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Link to="/" style={{ color: 'var(--text2)', fontSize: 13 }}>← Back to Shop</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
