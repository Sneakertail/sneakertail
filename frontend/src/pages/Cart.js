import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ProductThumb({ product }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="list-card-img">
            {product.image && !failed ? (
                <img src={product.image} alt={product.name} className="product-photo" onError={() => setFailed(true)} />
            ) : (
                <div className="product-image-fallback swiss-diagonal">{product.brand}</div>
            )}
        </div>
    );
}

function Cart({ user, showToast, onCartUpdate }) {
    const [cartMap, setCartMap] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || '/api';

    const loadCart = useCallback(() => {
        const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cartIds.length === 0) { setCartMap({}); setLoading(false); return; }
        fetch(PRODUCT_API)
            .then((res) => res.json())
            .then((products) => {
                const map = {};
                cartIds.forEach((id) => {
                    const product = products.find((entry) => entry.id === id);
                    if (product) {
                        if (map[id]) map[id].qty += 1;
                        else map[id] = { product, qty: 1 };
                    }
                });
                setCartMap(map);
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load cart', 'error'); setLoading(false); });
    }, [PRODUCT_API, showToast]);

    useEffect(() => { loadCart(); }, [loadCart]);

    const syncLocalStorage = (map) => {
        const ids = [];
        Object.entries(map).forEach(([id, { qty }]) => {
            for (let i = 0; i < qty; i += 1) ids.push(Number(id));
        });
        localStorage.setItem('cart', JSON.stringify(ids));
        onCartUpdate();
    };

    const changeQty = (productId, delta) => {
        setCartMap((prev) => {
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
        setCartMap((prev) => {
            const entry = prev[productId];
            const next = { ...prev };
            delete next[productId];
            syncLocalStorage(next);
            if (entry) showToast(`${entry.product.name} removed from cart`);
            return next;
        });

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
    const itemCount = entries.reduce((sum, entry) => sum + entry.qty, 0);
    const total = entries.reduce((sum, entry) => sum + (entry.product.price * entry.qty), 0);

    if (loading) {
        return <div className="container"><div className="empty-state"><div className="empty-icon">Loading</div><div className="empty-title">Loading Cart</div></div></div>;
    }

    return (
        <div className="container">
            <div className="page-header">
                <div className="section-label">04. Basket</div>
                <h1 className="page-title">Cart</h1>
                <p className="page-sub">{itemCount} item{itemCount !== 1 ? 's' : ''} currently staged for checkout.</p>
            </div>

            {entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">Cart</div>
                    <div className="empty-title">Your Cart Is Empty</div>
                    <div className="empty-sub">Browse current stock and add products you want to buy now.</div>
                    <Link to="/" className="btn btn-primary">Shop Now</Link>
                </div>
            ) : (
                <div className="checkout-grid">
                    <div className="list-stack">
                        {entries.map(({ product, qty }) => (
                            <article key={product.id} className="list-card">
                                <ProductThumb product={product} />
                                <div className="list-card-info">
                                    <div className="list-card-brand">{product.brand}</div>
                                    <div className="list-card-name">{product.name}</div>
                                    <div>{product.category}</div>
                                    <div className="list-card-price">${product.price}</div>
                                </div>
                                <div className="list-card-actions">
                                    <div className="qty-controls">
                                        <button className="qty-btn" onClick={() => changeQty(product.id, -1)}>-</button>
                                        <span className="qty-value">{qty}</span>
                                        <button className="qty-btn" onClick={() => changeQty(product.id, 1)}>+</button>
                                    </div>
                                    <div style={{ fontWeight: 900 }}>${(product.price * qty).toFixed(2)}</div>
                                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(product.id)}>Remove</button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="checkout-panel">
                        <div className="checkout-panel-header">Order Summary</div>
                        <div className="checkout-panel-body">
                            {entries.map(({ product, qty }) => (
                                <div key={product.id} className="summary-row">
                                    <span>{product.name} x {qty}</span>
                                    <span>${(product.price * qty).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={() => navigate('/checkout')}>
                                Proceed To Checkout
                            </button>
                            <button className="btn btn-outline btn-full" style={{ marginTop: 10 }} onClick={clearCart}>
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cart;
