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
        } catch (e) { return null; }
    });

    const [toast, setToast] = useState(null);
    const [cartCount, setCartCount] = useState(0);

    const refreshCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.length);
    };

    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    }, [user]);

    useEffect(() => {
        refreshCartCount();
        const onStorage = () => refreshCartCount();
        window.addEventListener('storage', onStorage);
        window.addEventListener('cartUpdated', onStorage);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('cartUpdated', onStorage);
        };
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCartUpdate = () => {
        refreshCartCount();
        window.dispatchEvent(new Event('cartUpdated'));
    };

    return (
        <div className="page-shell">
            <NavBar user={user} setUser={setUser} cartCount={cartCount} />
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
            <Routes>
                <Route path="/" element={<Home user={user} showToast={showToast} onCartUpdate={handleCartUpdate} />} />
                <Route path="/cart" element={<Cart user={user} showToast={showToast} onCartUpdate={handleCartUpdate} />} />
                <Route path="/wishlist" element={<Wishlist user={user} showToast={showToast} onCartUpdate={handleCartUpdate} />} />
                <Route path="/checkout" element={<Checkout user={user} showToast={showToast} onCartUpdate={handleCartUpdate} />} />
                <Route path="/login" element={<Login setUser={setUser} showToast={showToast} />} />
                <Route path="/admin" element={<Admin user={user} showToast={showToast} />} />
            </Routes>
        </div>
    );
}

export default App;
