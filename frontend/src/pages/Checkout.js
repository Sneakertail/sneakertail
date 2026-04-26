import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ProductThumb({ item }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="list-card-img">
            {item.image && !failed ? (
                <img src={item.image} alt={item.name} className="product-photo" onError={() => setFailed(true)} />
            ) : (
                <div className="product-image-fallback swiss-dots">{item.brand}</div>
            )}
        </div>
    );
}

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
            .then((res) => res.json())
            .then((products) => {
                const map = {};
                cartIds.forEach((id) => {
                    const product = products.find((entry) => entry.id === id);
                    if (product) {
                        if (map[id]) map[id].qty += 1;
                        else map[id] = { ...product, qty: 1 };
                    }
                });
                setItems(Object.values(map));
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load items', 'error'); setLoading(false); });
    }, [PRODUCT_API, showToast]);

    const itemCount = items.reduce((sum, product) => sum + product.qty, 0);
    const total = items.reduce((sum, product) => sum + (product.price * product.qty), 0);
    const tax = +(total * 0.08).toFixed(2);
    const grandTotal = +(total + tax).toFixed(2);

    const purchaseItems = items.map((item) => ({
        productId: item.id,
        qty: item.qty,
        name: item.name,
        price: item.price,
    }));

    const handlePayment = async () => {
        if (!user) {
            showToast('Please login to proceed', 'error');
            navigate('/login');
            return;
        }

        setPaying(true);
        try {
            const validateResponse = await fetch(`${PRODUCT_API}/validate-purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: purchaseItems }),
            });
            const validateData = await validateResponse.json();
            if (!validateResponse.ok || !validateData.valid) {
                throw new Error((validateData.errors || ['Unable to validate stock']).join(', '));
            }

            const paymentResponse = await fetch(`${PAYMENT_API}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    amount: grandTotal,
                    type: 'checkout',
                    items: purchaseItems,
                    paymentDetails: {}
                })
            });
            const paymentData = await paymentResponse.json();
            if (!paymentResponse.ok || paymentData.status !== 'SUCCESS') {
                throw new Error(paymentData.message || 'Payment declined');
            }

            const purchaseResponse = await fetch(`${PRODUCT_API}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: purchaseItems }),
            });
            const purchaseData = await purchaseResponse.json();
            if (!purchaseResponse.ok || purchaseData.status !== 'SUCCESS') {
                throw new Error((purchaseData.errors || ['Failed to update stock']).join(', '));
            }

            setPaid(true);
            localStorage.removeItem('cart');
            await fetch(`${INTERACTION_API}/cart/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId })
            }).catch(console.error);

            onCartUpdate();
            showToast(`Payment successful. Transaction ${paymentData.transactionId}`);
        } catch (error) {
            showToast(error.message || 'Payment error', 'error');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return <div className="container"><div className="empty-state"><div className="empty-icon">Loading</div><div className="empty-title">Loading Checkout</div></div></div>;
    }

    if (paid) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-icon">Confirmed</div>
                    <div className="empty-title">Order Confirmed</div>
                    <div className="empty-sub">Your payment was successful and stock has been updated.</div>
                    <Link to="/" className="btn btn-primary">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <div className="section-label">06. Checkout</div>
                <h1 className="page-title">Payment Review</h1>
                <p className="page-sub">Clean summary, stock validation before payment, and inventory updates immediately after purchase.</p>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">Checkout</div>
                    <div className="empty-title">No Items To Checkout</div>
                    <div className="empty-sub">Add products to the cart before starting payment.</div>
                    <Link to="/" className="btn btn-primary">Shop Now</Link>
                </div>
            ) : (
                <div className="checkout-grid">
                    <div className="list-stack">
                        {items.map((item) => (
                            <article key={item.id} className="list-card">
                                <ProductThumb item={item} />
                                <div className="list-card-info">
                                    <div className="list-card-brand">{item.brand}</div>
                                    <div className="list-card-name">{item.name}</div>
                                    <div>Qty {item.qty}</div>
                                    <div className="list-card-price">${(item.price * item.qty).toFixed(2)}</div>
                                </div>
                            </article>
                        ))}
                        <div style={{ marginTop: 16 }}>
                            <Link to="/cart" className="btn btn-outline">Back To Cart</Link>
                        </div>
                    </div>

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
                                <span>Free</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${grandTotal}</span>
                            </div>

                            <button className="btn btn-primary btn-full" style={{ marginTop: 18 }} onClick={handlePayment} disabled={paying}>
                                {paying ? 'Processing Payment' : `Pay $${grandTotal}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Checkout;
