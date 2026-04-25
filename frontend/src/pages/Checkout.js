import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Checkout({ user, showToast, onCartUpdate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const PAYMENT_API = process.env.REACT_APP_PAYMENT_API || '/api/payment';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || '/api';
    const navigate = useNavigate();

    useEffect(() => {
        const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cartIds.length === 0) { setItems([]); setLoading(false); return; }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                // Build qty map then convert to array
                const map = {};
                cartIds.forEach(id => {
                    const product = products.find(p => p.id === id);
                    if (product) {
                        if (map[id]) { map[id].qty += 1; }
                        else { map[id] = { ...product, qty: 1 }; }
                    }
                });
                setItems(Object.values(map));
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load items', 'error'); setLoading(false); });
    }, []);

    const itemCount = items.reduce((s, p) => s + p.qty, 0);
    const total = items.reduce((s, p) => s + (p.price * p.qty), 0);
    const tax = +(total * 0.08).toFixed(2);
    const grandTotal = +(total + tax).toFixed(2);

    const handlePayment = () => {
        if (!user) {
            showToast('Please login to proceed', 'error');
            navigate('/login');
            return;
        }
        setPaying(true);
        fetch(`${PAYMENT_API}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, amount: grandTotal, paymentDetails: {} })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'SUCCESS') {
                    setPaid(true);
                    localStorage.removeItem('cart');
                    if (user) {
                        fetch(`${INTERACTION_API}/cart/clear`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.userId })
                        }).catch(console.error);
                    }
                    onCartUpdate();
                    showToast(`Payment successful! Transaction: ${data.transactionId}`);
                } else {
                    showToast('Payment declined. Please try again.', 'error');
                }
            })
            .catch(() => showToast('Payment error. Check your connection.', 'error'))
            .finally(() => setPaying(false));
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>Loading...</div>
    );

    if (paid) return (
        <div className="container">
            <div className="empty-state" style={{ paddingTop: 100 }}>
                <div className="empty-icon">🎉</div>
                <div className="empty-title">Order Confirmed!</div>
                <div className="empty-sub">Your payment was successful. Your kicks are on the way!</div>
                <Link to="/" className="btn btn-primary">Continue Shopping</Link>
            </div>
        </div>
    );

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Checkout</h1>
                <p className="page-sub">Review your order and complete payment</p>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <div className="empty-title">No items to checkout</div>
                    <div className="empty-sub">Add some products to your cart first.</div>
                    <Link to="/" className="btn btn-primary">Shop Now</Link>
                </div>
            ) : (
                <div className="checkout-grid">
                    {/* Items */}
                    <div>
                        <div className="checkout-panel">
                            <div className="checkout-panel-header">Your Items ({itemCount})</div>
                            <div className="checkout-panel-body">
                                <div className="list-stack">
                                    {items.map((item) => (
                                        <div key={item.id} className="list-card" style={{ padding: '12px' }}>
                                            <div className="list-card-img" style={{ width: 56, height: 56, fontSize: 24 }}>👟</div>
                                            <div className="list-card-info">
                                                <div className="list-card-brand">{item.brand}</div>
                                                <div className="list-card-name">{item.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Qty: {item.qty}</div>
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', flexShrink: 0 }}>${(item.price * item.qty).toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <Link to="/cart" className="btn btn-outline btn-sm">← Edit Cart</Link>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="checkout-panel">
                        <div className="checkout-panel-header">Payment Summary</div>
                        <div className="checkout-panel-body">
                            <div className="summary-row">
                                <span>Subtotal ({itemCount} items)</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax (8%)</span>
                                <span>${tax}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span style={{ color: 'var(--accent)' }}>FREE</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${grandTotal}</span>
                            </div>

                            <button
                                className="btn btn-primary btn-full"
                                style={{ marginTop: 20 }}
                                onClick={handlePayment}
                                disabled={paying}
                            >
                                {paying ? 'Processing...' : `Pay $${grandTotal}`}
                            </button>

                            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
                                🔒 Secured by Sneakertail Payments
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Checkout;
