import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Cart({ user, showToast, onCartUpdate }) {
    const [cartMap, setCartMap] = useState({}); // { productId: { product, qty } }
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || '/api';

    const loadCart = useCallback(() => {
        const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cartIds.length === 0) { setCartMap({}); setLoading(false); return; }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                // Build quantity map
                const map = {};
                cartIds.forEach(id => {
                    const product = products.find(p => p.id === id);
                    if (product) {
                        if (map[id]) {
                            map[id].qty += 1;
                        } else {
                            map[id] = { product, qty: 1 };
                        }
                    }
                });
                setCartMap(map);
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load cart', 'error'); setLoading(false); });
    }, [PRODUCT_API]);

    useEffect(() => { loadCart(); }, [loadCart]);

    // Sync cartMap back to localStorage
    const syncLocalStorage = (map) => {
        const ids = [];
        Object.entries(map).forEach(([id, { qty }]) => {
            for (let i = 0; i < qty; i++) ids.push(Number(id));
        });
        localStorage.setItem('cart', JSON.stringify(ids));
        onCartUpdate();
    };

    const changeQty = (productId, delta) => {
        setCartMap(prev => {
            const entry = prev[productId];
            if (!entry) return prev;
            const newQty = entry.qty + delta;
            let next;
            if (newQty <= 0) {
                next = { ...prev };
                delete next[productId];
                showToast(`${entry.product.name} removed from cart`);
            } else {
                next = { ...prev, [productId]: { ...entry, qty: newQty } };
            }
            syncLocalStorage(next);
            return next;
        });

        // Sync with interaction service
        if (user) {
            const endpoint = delta > 0 ? 'cart/add' : 'cart/remove';
            fetch(`${INTERACTION_API}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, productId })
            }).catch(console.error);
        }
    };

    const removeItem = (productId) => {
        setCartMap(prev => {
            const entry = prev[productId];
            const next = { ...prev };
            delete next[productId];
            syncLocalStorage(next);
            if (entry) showToast(`${entry.product.name} removed from cart`);
            return next;
        });

        // Clear all of this product from interaction service
        if (user) {
            fetch(`${INTERACTION_API}/cart/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, productId })
            }).catch(console.error);
        }
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
        setCartMap({});
        onCartUpdate();
        showToast('Cart cleared');
    };

    const entries = Object.values(cartMap);
    const itemCount = entries.reduce((s, e) => s + e.qty, 0);
    const total = entries.reduce((s, e) => s + (e.product.price * e.qty), 0);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>Loading cart...</div>
    );

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">🛒 Your Cart</h1>
                <p className="page-sub">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
            </div>

            {entries.length === 0 ? (
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
                            {entries.map(({ product, qty }) => (
                                <div key={product.id} className="list-card">
                                    <div className="list-card-img">👟</div>
                                    <div className="list-card-info">
                                        <div className="list-card-brand">{product.brand}</div>
                                        <div className="list-card-name">{product.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{product.category}</div>
                                        <div className="list-card-price" style={{ marginTop: 6 }}>${product.price}</div>
                                    </div>
                                    <div className="list-card-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                                        {/* Quantity controls */}
                                        <div className="qty-controls">
                                            <button
                                                className="qty-btn"
                                                onClick={() => changeQty(product.id, -1)}
                                            >−</button>
                                            <span className="qty-value">{qty}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => changeQty(product.id, 1)}
                                            >+</button>
                                        </div>
                                        {/* Line total */}
                                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                                            ${(product.price * qty).toFixed(2)}
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeItem(product.id)}
                                            title="Remove all"
                                        >Remove</button>
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
                            {entries.map(({ product, qty }) => (
                                <div key={product.id} className="summary-row">
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                        {product.name} × {qty}
                                    </span>
                                    <span>${(product.price * qty).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="summary-row total">
                                <span>Total ({itemCount} items)</span>
                                <span>${total.toFixed(2)}</span>
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
