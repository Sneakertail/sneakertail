import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUser, showToast }) {
    const [tab, setTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const AUTH_API = process.env.REACT_APP_AUTH_API || '/api/auth';
    const navigate = useNavigate();

    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

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
            .then((res) => res.json())
            .then((data) => {
                if (data.token) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    showToast(`Welcome back ${data.firstName || data.username}`);
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
            showToast('Please fill in all required fields', 'error');
            return;
        }
        if (regPassword !== regConfirm) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (regPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
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
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (ok) {
                    showToast('Account created. Please sign in.');
                    setTab('login');
                    setLoginUsername(regUsername);
                    setLoginPassword('');
                    setRegUsername('');
                    setRegPassword('');
                    setRegConfirm('');
                    setRegFirstName('');
                    setRegLastName('');
                    setRegEmail('');
                } else {
                    showToast(data.error || 'Registration failed', 'error');
                }
            })
            .catch(() => showToast('Connection error. Is the server running?', 'error'))
            .finally(() => setLoading(false));
    };

    return (
        <div className="container auth-page">
            <div className="auth-shell">
                <aside className="auth-aside swiss-grid-pattern">
                    <div>
                        <div className="section-label">07. Membership</div>
                        <h1 className="auth-title">Sign In. Register. Keep Moving.</h1>
                        <p className="auth-sub">
                            The layout changes here too: stronger type, harder geometry, and a quieter retail feel while the auth flow remains exactly the same.
                        </p>
                    </div>

                    <div className="auth-blocks">
                        <div className="auth-block">
                            <div className="micro-label">Admin</div>
                            <div style={{ marginTop: 8, fontWeight: 900 }}>Manage stock, raffles, and sales.</div>
                        </div>
                        <div className="auth-block swiss-diagonal">
                            <div className="micro-label">Member</div>
                            <div style={{ marginTop: 8, fontWeight: 900 }}>Save products, buy pairs, enter raffles.</div>
                        </div>
                    </div>
                </aside>

                <div className="auth-card">
                    <div className="tabs">
                        <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login</button>
                        <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
                    </div>

                    {tab === 'login' && (
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input className="form-input" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} autoComplete="username" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Signing In' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {tab === 'register' && (
                        <form onSubmit={handleRegister}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input className="form-input" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} autoComplete="username" />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input className="form-input" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} autoComplete="new-password" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input className="form-input" type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} autoComplete="new-password" />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Creating Account' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    <div style={{ marginTop: 18 }}>
                        <Link to="/" className="btn btn-outline">Back To Shop</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
