import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Login from './pages/Login';

function App() {
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState('');

    return (
        <div style={{ padding: '20px' }}>
            <NavBar user={user} setUser={setUser} />
            {message && <div style={{ background: '#ddd', padding: '10px', margin: '10px 0' }}>{message}</div>}
            <Routes>
                <Route path="/" element={<Home user={user} setMessage={setMessage} />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<Checkout user={user} setMessage={setMessage} />} />
                <Route path="/login" element={<Login setUser={setUser} setMessage={setMessage} />} />
            </Routes>
        </div>
    );
}

export default App;
