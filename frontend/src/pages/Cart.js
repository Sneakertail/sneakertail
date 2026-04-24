import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Cart({ user, showToast, onCartUpdate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || 'http://localhost:3002/api/products';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || 'http://localhost:3004/api';

    const loadCart = useCallback(() => {
        const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cartIds.length === 0) { setItems([]); setLoading(false); return; }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                // Keep duplicates — same product can be added multiple times
                const cartProducts = cartIds.map(id => products.find(p => p.id === id)).filter(Boolean);
                setItems(cartProducts);
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load cart', 'error'); setLoading(false); });
    }, [PRODUCT_API]);

    useEffect(() => { loadCart(); }, [loadCart]);

    const removeItem = (product, index) => {
        // Remove from localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        // Remove by index (handles duplicates)
        let removed = false;
        const newCart = cart.filter((id, i) => {
            if (!removed && id === product.id) { removed = true; return false; }
            return true;
        });
        localStorage.setItem('cart', JSON.stringify(newCart));

        // Also call interaction service if user is logged in
        if (user) {
            fetch(`${INTERACTION_API}/cart/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, productId: product.id })
            }).catch(console.error);
        }

        setItems(prev => prev.filter((_, i) => i !== index));
        onCartUpdate();
        showToast(`${product.name} removed from cart`);
    };

    const clearCart = () => {
        localStorage.removeItem('cart');
        if (user) {
            fetch(`${INTERACTION_API}/cart/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId })
            }).catch(console.error);
        }
        setItems([]);
        onCartUpdate();
        showToast('Cart cleared');
    };

    const total = items.reduce((s, p) => s + (p.price || 0), 0);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>Loading cart...</div>
    );

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">🛒 Your Cart</h1>
                <p className="page-sub">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <div className="empty-title">Your cart is empty</div>
                    <div className="empty-sub">Browse our latest drops and add something you love.</div>
                    <Link to="/" className="btn btn-primary">Shop Now</Link>
                </div>
            ) : (
                <div className="checkout-grid">
                    {/* Items list */}
                    <div>
                        <div className="list-stack">
                            {items.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="list-card">
                                    <div className="list-card-img">👟</div>
                                    <div className="list-card-info">
                                        <div className="list-card-brand">{item.brand}</div>
                                        <div className="list-card-name">{item.name}</div>
                                        {item.description && (
                                            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.category}</div>
                                        )}
                                        <div className="list-card-price" style={{ marginTop: 6 }}>${item.price}</div>
                                    </div>
                                    <div className="list-card-actions">
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeItem(item, idx)}
                                            title="Remove"
                                        >✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <button className="btn btn-outline btn-sm" onClick={clearCart}>Clear Cart</button>
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="checkout-panel">
                        <div className="checkout-panel-header">Order Summary</div>
                        <div className="checkout-panel-body">
                            {items.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="summary-row">
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{item.name}</span>
                                    <span>${item.price}</span>
                                </div>
                            ))}
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${total}</span>
                            </div>
                            <button
                                className="btn btn-primary btn-full"
                                style={{ marginTop: 16 }}
                                onClick={() => navigate('/checkout')}
                            >
                                Proceed to Checkout →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;
