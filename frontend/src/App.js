import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Admin from './pages/Admin';

function App() {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    }, [user]);

    return (
        <div>
            <NavBar user={user} setUser={setUser} />
            <div className="container">
                {message && <div style={{ background: '#ddd', padding: '10px', margin: '10px 0' }}>{message}</div>}
                <Routes>
                    <Route path="/" element={<Home user={user} setMessage={setMessage} />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/checkout" element={<Checkout user={user} setMessage={setMessage} />} />
                    <Route path="/login" element={<Login setUser={setUser} setMessage={setMessage} />} />
                    <Route path="/admin" element={<Admin user={user} setMessage={setMessage} />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;
