import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function NavBar({ user, setUser, cartCount }) {
    const navigate = useNavigate();

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
        navigate('/');
    };

    const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

    return (
        <header className="navbar">
            <div className="nav-inner">
                <NavLink to="/" className="brand">Sneakertail</NavLink>

                <nav className="nav-links" aria-label="Primary">
                    <NavLink to="/" className={linkClass}>Home</NavLink>
                    <div className="cart-badge-wrap">
                        <NavLink to="/cart" className={linkClass}>Cart</NavLink>
                        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                    </div>
                    <NavLink to="/wishlist" className={linkClass}>Wishlist</NavLink>
                    {user && user.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
                    {!user && <NavLink to="/login" className={({ isActive }) => `${linkClass({ isActive })} nav-link-login`}>Login</NavLink>}
                </nav>

                {user && (
                    <div className="nav-side">
                        <span className="user-badge">{user.firstName || user.username || user.role}</span>
                        <button onClick={logout} className="nav-action">Logout</button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default NavBar;
