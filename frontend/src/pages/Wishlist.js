import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

function Wishlist({ user, showToast, onCartUpdate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState({});

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || 'http://localhost:3002/api/products';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || 'http://localhost:3004/api';

    const loadWishlist = useCallback(() => {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (wishlistIds.length === 0) { setItems([]); setLoading(false); return; }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                const wishlistProducts = wishlistIds.map(id => products.find(p => p.id === id)).filter(Boolean);
                setItems(wishlistProducts);
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load wishlist', 'error'); setLoading(false); });
    }, [PRODUCT_API]);

    useEffect(() => { loadWishlist(); }, [loadWishlist]);

    const removeFromWishlist = (product) => {
        // Update localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const newWishlist = wishlist.filter(id => id !== product.id);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));

        // Call interaction service if logged in
        if (user) {
            fetch(`${INTERACTION_API}/wishlist/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, productId: product.id })
            }).catch(console.error);
        }

        setItems(prev => prev.filter(p => p.id !== product.id));
        showToast(`${product.name} removed from wishlist`);
    };

    const moveToCart = (product) => {
        if (!user) { showToast('Please login first', 'error'); return; }
        if (product.raffleActive) { showToast('Raffle items cannot be added to cart — enter the raffle instead!', 'error'); return; }

        const key = `cart_${product.id}`;
        setBusy(b => ({ ...b, [key]: true }));

        fetch(`${INTERACTION_API}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, productId: product.id })
        })
            .then(res => res.json())
            .then(() => {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                cart.push(product.id);
                localStorage.setItem('cart', JSON.stringify(cart));

                // Remove from wishlist (actual move)
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                localStorage.setItem('wishlist', JSON.stringify(wishlist.filter(id => id !== product.id)));
                if (user) {
                    fetch(`${INTERACTION_API}/wishlist/remove`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.userId, productId: product.id })
                    }).catch(console.error);
                }
                setItems(prev => prev.filter(p => p.id !== product.id));

                onCartUpdate();
                showToast(`${product.name} moved to cart! 🛒`);
            })
            .catch(() => showToast('Failed to add to cart', 'error'))
            .finally(() => setBusy(b => ({ ...b, [key]: false })));
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>Loading wishlist...</div>
    );

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">❤️ Wishlist</h1>
                <p className="page-sub">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">❤️</div>
                    <div className="empty-title">Your wishlist is empty</div>
                    <div className="empty-sub">Save items you love and come back to them later.</div>
                    <Link to="/" className="btn btn-primary">Explore Drops</Link>
                </div>
            ) : (
                <div className="list-stack">
                    {items.map(item => (
                        <div key={item.id} className="list-card" style={item.raffleActive ? { borderColor: 'rgba(255,184,0,0.3)', background: 'linear-gradient(135deg,#1a1400,#1a1000)' } : {}}>
                            <div className="list-card-img">👟</div>
                            <div className="list-card-info">
                                <div className="list-card-brand">{item.brand}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="list-card-name">{item.name}</div>
                                    {item.raffleActive && <span className="badge badge-gold">RAFFLE</span>}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.category}</div>
                                <div className="list-card-price" style={{ marginTop: 6, color: item.raffleActive ? 'var(--gold2)' : 'var(--accent)' }}>${item.price}</div>
                            </div>
                            <div className="list-card-actions">
                                {!item.raffleActive && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => moveToCart(item)}
                                        disabled={busy[`cart_${item.id}`]}
                                    >
                                        {busy[`cart_${item.id}`] ? '...' : '🛒 Add to Cart'}
                                    </button>
                                )}
                                {item.raffleActive && (
                                    <Link to="/" className="btn btn-gold btn-sm">🎰 Enter Raffle</Link>
                                )}
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeFromWishlist(item)}
                                    title="Remove from wishlist"
                                >✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Wishlist;
