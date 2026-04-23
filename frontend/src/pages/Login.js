import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setUser, setMessage }) {
    const [username, setUsername] = useState('user');
    const [password, setPassword] = useState('user');
    const AUTH_API = process.env.REACT_APP_AUTH_API || 'http://localhost:3001/api/auth';
    const navigate = useNavigate();

    const submit = (e) => {
        e.preventDefault();
        fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    setUser(data);
                    setMessage('Logged in');
                    navigate('/');
                    setTimeout(() => setMessage(''), 2000);
                } else {
                    setMessage('Login failed');
                }
            })
            .catch(() => setMessage('Login error'));
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Login</h2>
            <form onSubmit={submit}>
                <div style={{ marginBottom: 8 }}>
                    <input value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <input value={password} type="password" onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;
