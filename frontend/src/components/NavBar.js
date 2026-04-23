import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavBar({ user, setUser }) {
    const navigate = useNavigate();

    const logout = () => {
        setUser(null);
        navigate('/');
    };

    return (
        <nav style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
            <Link to="/" style={{ marginRight: 10 }}>Home</Link>
            <Link to="/cart" style={{ marginRight: 10 }}>Cart</Link>
            <Link to="/wishlist" style={{ marginRight: 10 }}>Wishlist</Link>
            <Link to="/checkout" style={{ marginRight: 10 }}>Checkout</Link>
            {!user ? (
                <Link to="/login" style={{ marginLeft: 10 }}>Login</Link>
            ) : (
                <button onClick={logout} style={{ marginLeft: 10 }}>Logout</button>
            )}
            {user && <span style={{ marginLeft: 10 }}>User {user.userId}</span>}
        </nav>
    );
}

export default NavBar;
