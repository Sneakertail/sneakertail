import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavBar({ user, setUser, cartCount }) {
    const navigate = useNavigate();

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
        navigate('/');
    };

    return (
        <header className="navbar">
            <div className="nav-inner">
                <Link to="/" className="brand">SNEAKERTAIL</Link>
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <div className="cart-badge-wrap">
                        <Link to="/cart">Cart</Link>
                        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                    </div>
                    <Link to="/wishlist">Wishlist</Link>
                    {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
                    {!user ? (
                        <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
                    ) : (
                        <>
                            <span className="user-badge">👤 {user.firstName || user.username || user.role}</span>
                            <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default NavBar;
