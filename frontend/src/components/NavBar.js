import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavBar({ user, setUser }) {
    const navigate = useNavigate();

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <header className="navbar">
            <div className="container nav-inner">
                <Link to="/" className="brand">SNEAKERTAIL</Link>
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/cart">Cart</Link>
                    <Link to="/wishlist">Wishlist</Link>
                    <Link to="/checkout">Checkout</Link>
                    {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
                    {!user ? (
                        <Link to="/login">Login</Link>
                    ) : (
                        <button onClick={logout} className="btn btn-outline">Logout</button>
                    )}
                    {user && <span className="user-badge">User {user.userId}</span>}
                </div>
            </div>
        </header>
    );
}

export default NavBar;
