import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Checkout({ user, setMessage }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const PRODUCT_API = 'http://localhost:3002/api/products';
    const PAYMENT_API = 'http://localhost:3005/api/payment';
    const navigate = useNavigate();

    useEffect(() => {
        const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cartIds.length === 0) {
            setItems([]);
            setTotal(0);
            return;
        }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                const cartProducts = products.filter(p => cartIds.includes(p.id));
                setItems(cartProducts);
                setTotal(cartProducts.reduce((s, p) => s + (p.price || 0), 0));
            });
    }, []);

    const handlePayment = () => {
        if (!user) {
            setMessage('Please login first');
            navigate('/login');
            return;
        }
        fetch(`${PAYMENT_API}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, amount: total, paymentDetails: {} })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'SUCCESS') {
                    setMessage('Payment successful: ' + data.transactionId);
                    localStorage.removeItem('cart');
                    navigate('/');
                } else {
                    setMessage('Payment failed');
                }
                setTimeout(() => setMessage(''), 4000);
            })
            .catch(() => setMessage('Payment error'));
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Checkout</h2>
            {items.length === 0 ? (
                <p>No items in cart</p>
            ) : (
                <div>
                    {items.map(it => (
                        <div key={it.id}>{it.name} - ${it.price}</div>
                    ))}
                    <h3>Total: ${total}</h3>
                    <button onClick={handlePayment} style={{ marginTop: 10, background: 'green', color: 'white' }}>Pay ${total}</button>
                </div>
            )}
        </div>
    );
}

export default Checkout;
