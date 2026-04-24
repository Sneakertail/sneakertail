import React, { useState, useEffect } from 'react';

function Home({ user, setMessage }) {
    const [products, setProducts] = useState([]);

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || 'http://localhost:3002/api/products';
    const RAFFLE_API = process.env.REACT_APP_RAFFLE_API || 'http://localhost:3003/api/raffle';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || 'http://localhost:3004/api';
    const PAYMENT_API = process.env.REACT_APP_PAYMENT_API || 'http://localhost:3005/api/payment';

    useEffect(() => {
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
    }, [PRODUCT_API]);

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
        <div>
            <div className="hero">
                <div>
                    <h1 className="hero-title">SNEAKERTAIL</h1>
                    <p className="hero-sub">Premium drops and raffles — cop your favorite sneakers.</p>
                </div>
            </div>

            <div className="container">
                <h2>Products</h2>
                <div className="product-grid">
                    {products.map(product => (
                        <div key={product.id} className="product-card">
                            <div>
                                <h3>{product.name}</h3>
                                <div className="price">${product.price}</div>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                {product.raffleActive ? (
                                    <button className="btn btn-outline" onClick={() => executeAction(`${RAFFLE_API}/enter`, { productId: product.id }, 'Entered Raffle!')}>Enter Raffle</button>
                                ) : (
                                    <button className="btn btn-primary" onClick={() => executeAction(`${INTERACTION_API}/cart/add`, { productId: product.id }, 'Added to Cart!')}>Add to Cart</button>
                                )}
                                <button className="btn btn-outline" onClick={() => executeAction(`${INTERACTION_API}/wishlist/add`, { productId: product.id }, 'Added to Wishlist!')} style={{ marginLeft: 10 }}>
                                    Wishlist
                                </button>
                                <button className="btn" onClick={() => executeAction(`${PAYMENT_API}/process`, { amount: product.price }, 'Payment Processed!')} style={{ marginLeft: 10, background: '#111', color: '#fff' }}>
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;
