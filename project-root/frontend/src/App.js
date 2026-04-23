import React, { useState, useEffect } from 'react';

function App() {
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState('');

    const AUTH_API = 'http://localhost:3001/api/auth';
    const PRODUCT_API = 'http://localhost:3002/api/products';
    const RAFFLE_API = 'http://localhost:3003/api/raffle';
    const INTERACTION_API = 'http://localhost:3004/api';
    const PAYMENT_API = 'http://localhost:3005/api/payment';

    useEffect(() => {
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(data => setProducts(data));
    }, []);

    const login = () => {
        fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'user', password: 'user' })
        })
            .then(res => res.json())
            .then(data => {
                if (data.token) setUser(data);
            });
    };

    const executeAction = (url, bodyParams, successMsg) => {
        if (!user) return setMessage('Please login first');
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, ...bodyParams })
        })
            .then(res => res.json())
            .then(() => {
                setMessage(successMsg);
                setTimeout(() => setMessage(''), 3000);
            });
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Microservices Sneaker Store</h1>
            {!user ? (
                <button onClick={login}>Login as User</button>
            ) : (
                <p>Logged in as: User ID {user.userId}</p>
            )}

            {message && <div style={{ background: '#ddd', padding: '10px', margin: '10px 0' }}>{message}</div>}

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {products.map(product => (
                    <div key={product.id} style={{ border: '1px solid black', padding: '15px' }}>
                        <h3>{product.name} - ${product.price}</h3>

                        {product.raffleActive ? (
                            <button onClick={() => executeAction(`${RAFFLE_API}/enter`, { productId: product.id }, 'Entered Raffle!')}>
                                Enter Raffle
                            </button>
                        ) : (
                            <button onClick={() => executeAction(`${INTERACTION_API}/cart/add`, { productId: product.id }, 'Added to Cart!')}>
                                Add to Cart
                            </button>
                        )}

                        <button onClick={() => executeAction(`${INTERACTION_API}/wishlist/add`, { productId: product.id }, 'Added to Wishlist!')} style={{ marginLeft: '10px' }}>
                            Wishlist
                        </button>

                        <button onClick={() => executeAction(`${PAYMENT_API}/process`, { amount: product.price }, 'Payment Processed!')} style={{ marginLeft: '10px', background: 'green', color: 'white' }}>
                            Buy Now
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
