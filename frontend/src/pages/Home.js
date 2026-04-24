import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PRODUCT_EMOJI = {
    'Nike': '👟', 'Adidas': '👟', 'New Balance': '👟',
    'default': '👟'
};

function ProductEmoji({ brand }) {
    return <span>{PRODUCT_EMOJI[brand] || PRODUCT_EMOJI['default']}</span>;
}

function Home({ user, showToast, onCartUpdate }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enteredRaffles, setEnteredRaffles] = useState(new Set());
    const [busy, setBusy] = useState({});

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || 'http://localhost:3002/api/products';
    const RAFFLE_API = process.env.REACT_APP_RAFFLE_API || 'http://localhost:3003/api/raffle';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || 'http://localhost:3004/api';

    useEffect(() => {
        setLoading(true);
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { showToast('Failed to load products', 'error'); setLoading(false); });
    }, []);

    const setBusyKey = (key, val) => setBusy(b => ({ ...b, [key]: val }));

    const requireLogin = () => { showToast('Please login first', 'error'); return false; };

    const addToCart = (product) => {
        if (!user) return requireLogin();
        const key = `cart_${product.id}`;
        setBusyKey(key, true);
        fetch(`${INTERACTION_API}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, productId: product.id })
        })
            .then(res => res.json())
            .then(() => {
                // Also persist in localStorage for offline reading
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                cart.push(product.id);
                localStorage.setItem('cart', JSON.stringify(cart));
                onCartUpdate();
                showToast(`${product.name} added to cart! 🛒`);
            })
            .catch(() => showToast('Failed to add to cart', 'error'))
            .finally(() => setBusyKey(key, false));
    };

    const addToWishlist = (product) => {
        if (!user) return requireLogin();
        const key = `wish_${product.id}`;
        setBusyKey(key, true);
        fetch(`${INTERACTION_API}/wishlist/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, productId: product.id })
        })
            .then(res => res.json())
            .then(() => {
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                if (!wishlist.includes(product.id)) wishlist.push(product.id);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                showToast(`${product.name} added to wishlist! ❤️`);
            })
            .catch(() => showToast('Failed to add to wishlist', 'error'))
            .finally(() => setBusyKey(key, false));
    };

    const enterRaffle = (product) => {
        if (!user) return requireLogin();
        if (enteredRaffles.has(product.id)) {
            showToast('Already entered this raffle!', 'error');
            return;
        }
        const key = `raffle_${product.id}`;
        setBusyKey(key, true);
        fetch(`${RAFFLE_API}/enter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, productId: product.id })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message && data.message.toLowerCase().includes('already')) {
                    showToast('Already entered this raffle!', 'error');
                } else {
                    setEnteredRaffles(s => new Set([...s, product.id]));
                    showToast(`You're entered into the ${product.name} raffle! 🎰`);
                }
            })
            .catch(() => showToast('Failed to enter raffle', 'error'))
            .finally(() => setBusyKey(key, false));
    };

    const raffleProducts = products.filter(p => p.raffleActive);
    const normalProducts = products.filter(p => !p.raffleActive);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>👟</div>
            <div>Loading drops...</div>
        </div>
    );

    return (
        <div>
            {/* Hero */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-eyebrow">Limited Drops &amp; Raffles</div>
                    <h1 className="hero-title">SNEAKERTAIL</h1>
                    <p className="hero-sub">Premium sneakers. Exclusive raffles. Your next grail is here.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                        <Link to="/cart" className="btn btn-primary">Shop Now</Link>
                        {!user && <Link to="/login" className="btn btn-outline">Login to Enter Raffles</Link>}
                    </div>
                </div>
            </section>

            <div className="container">
                {/* ── Raffle Section ── */}
                {raffleProducts.length > 0 && (
                    <section className="section">
                        <div className="raffle-section">
                            <div className="raffle-section-title">
                                🎰 Active Raffles
                                <span className="section-badge">LIVE</span>
                            </div>
                            <p className="raffle-section-sub">Enter for a chance to cop — winners drawn randomly. No direct purchase available.</p>
                            <div className="raffle-grid">
                                {raffleProducts.map(product => (
                                    <div key={product.id} className="raffle-card">
                                        <span className="raffle-badge">🎰 RAFFLE</span>
                                        <div className="product-image">
                                            <ProductEmoji brand={product.brand} />
                                        </div>
                                        <div className="product-body">
                                            <div className="product-brand">{product.brand}</div>
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-desc">{product.description}</div>
                                            {product.category && (
                                                <span className="badge badge-gold" style={{ marginTop: 4 }}>{product.category}</span>
                                            )}
                                        </div>
                                        <div className="product-footer">
                                            <div>
                                                <div className="product-price">${product.price}</div>
                                                <div className="product-stock">Raffle Entry Only</div>
                                            </div>
                                        </div>
                                        <div className="product-actions">
                                            {enteredRaffles.has(product.id) ? (
                                                <div className="raffle-entered-badge btn-full">✅ Entered — Good Luck!</div>
                                            ) : (
                                                <button
                                                    className="btn btn-gold btn-full"
                                                    onClick={() => enterRaffle(product)}
                                                    disabled={busy[`raffle_${product.id}`]}
                                                >
                                                    {busy[`raffle_${product.id}`] ? '...' : '🎰 Enter Raffle'}
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-outline btn-icon"
                                                onClick={() => addToWishlist(product)}
                                                disabled={busy[`wish_${product.id}`]}
                                                title="Add to Wishlist"
                                            >❤️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Normal Products ── */}
                <section className="section" style={{ paddingTop: raffleProducts.length > 0 ? 0 : 48 }}>
                    <div className="section-header">
                        <div>
                            <div className="section-label">Available Now</div>
                            <div className="section-title">Shop All Sneakers</div>
                        </div>
                    </div>
                    {normalProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <div className="empty-title">No products available</div>
                            <div className="empty-sub">Check back soon for new drops.</div>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {normalProducts.map(product => (
                                <div key={product.id} className="product-card">
                                    <div className="product-image">
                                        <ProductEmoji brand={product.brand} />
                                    </div>
                                    <div className="product-body">
                                        <div className="product-brand">{product.brand}</div>
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-desc">{product.description}</div>
                                        {product.category && (
                                            <span className="badge badge-green" style={{ marginTop: 4 }}>{product.category}</span>
                                        )}
                                    </div>
                                    <div className="product-footer">
                                        <div>
                                            <div className="product-price">${product.price}</div>
                                            <div className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : <span style={{ color: 'var(--red)' }}>Out of stock</span>}</div>
                                        </div>
                                    </div>
                                    <div className="product-actions">
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: 1 }}
                                            onClick={() => addToCart(product)}
                                            disabled={busy[`cart_${product.id}`] || product.stock === 0}
                                        >
                                            {busy[`cart_${product.id}`] ? '...' : '🛒 Add to Cart'}
                                        </button>
                                        <button
                                            className="btn btn-outline btn-icon"
                                            onClick={() => addToWishlist(product)}
                                            disabled={busy[`wish_${product.id}`]}
                                            title="Add to Wishlist"
                                        >❤️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Home;
