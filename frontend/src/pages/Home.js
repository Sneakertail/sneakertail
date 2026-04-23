import React, { useState, useEffect } from 'react';

function Home({ user, setMessage }) {
    const [products, setProducts] = useState([]);

    const PRODUCT_API = 'http://localhost:3002/api/products';
    const RAFFLE_API = 'http://localhost:3003/api/raffle';
    const INTERACTION_API = 'http://localhost:3004/api';
    const PAYMENT_API = 'http://localhost:3005/api/payment';

    useEffect(() => {
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
    }, []);

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
                if (url.includes('/cart/add')) {
                    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    cart.push(bodyParams.productId);
                    localStorage.setItem('cart', JSON.stringify(cart));
                } else if (url.includes('/wishlist/add')) {
                    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                    wishlist.push(bodyParams.productId);
                    localStorage.setItem('wishlist', JSON.stringify(wishlist));
                }
                setTimeout(() => setMessage(''), 3000);
            })
            .catch(() => setMessage('Action failed'));
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Products</h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {products.map(product => (
                    <div key={product.id} style={{ border: '1px solid #ccc', padding: 10, width: 260 }}>
                        <h3>{product.name} - ${product.price}</h3>
                        {product.raffleActive ? (
                            <button onClick={() => executeAction(`${RAFFLE_API}/enter`, { productId: product.id }, 'Entered Raffle!')}>Enter Raffle</button>
                        ) : (
                            <button onClick={() => executeAction(`${INTERACTION_API}/cart/add`, { productId: product.id }, 'Added to Cart!')}>Add to Cart</button>
                        )}
                        <button onClick={() => executeAction(`${INTERACTION_API}/wishlist/add`, { productId: product.id }, 'Added to Wishlist!')} style={{ marginLeft: 10 }}>
                            Wishlist
                        </button>
                        <button onClick={() => executeAction(`${PAYMENT_API}/process`, { amount: product.price }, 'Payment Processed!')} style={{ marginLeft: 10, background: 'green', color: 'white' }}>
                            Buy Now
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;
