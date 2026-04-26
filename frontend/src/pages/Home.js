import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ProductImage({ product, className = 'product-image' }) {
    const [failed, setFailed] = useState(false);
    const canShowImage = !!product.image && !failed;

    return (
        <div className={className}>
            {canShowImage ? (
                <img
                    src={product.image}
                    alt={product.name}
                    className="product-photo"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="product-image-fallback swiss-diagonal">
                    <span>{product.brand}<br />{product.name}</span>
                </div>
            )}
        </div>
    );
}

function Home({ user, showToast, onCartUpdate }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [raffleStatuses, setRaffleStatuses] = useState({});
    const [busy, setBusy] = useState({});

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const RAFFLE_API = process.env.REACT_APP_RAFFLE_API || '/api/raffle';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || '/api';

    const setBusyKey = (key, val) => setBusy((current) => ({ ...current, [key]: val }));
    const requireLogin = () => { showToast('Please login first', 'error'); return false; };

    const loadProducts = () => {
        setLoading(true);
        fetch(PRODUCT_API)
            .then((res) => res.json())
            .then((data) => {
                setProducts(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                showToast('Failed to load products', 'error');
                setLoading(false);
            });
    };

    const loadRaffleStatuses = (productList) => {
        const raffleProducts = productList.filter((product) => product.raffleActive);
        if (raffleProducts.length === 0) {
            setRaffleStatuses({});
            return;
        }

        Promise.all(
            raffleProducts.map((product) =>
                fetch(`${RAFFLE_API}/status/${product.id}/${user?.userId || 'guest'}`)
                    .then((res) => res.json())
                    .then((status) => [product.id, status])
                    .catch(() => [product.id, { entered: false, raffleOver: false, isWinner: false, winnerUserId: null, totalEntries: 0 }])
            )
        ).then((entries) => setRaffleStatuses(Object.fromEntries(entries)));
    };

    useEffect(() => { loadProducts(); }, []);
    useEffect(() => { loadRaffleStatuses(products); }, [products, user]);

    const addToCart = (product) => {
        if (!user) return requireLogin();
        const key = `cart_${product.id}`;
        setBusyKey(key, true);
        fetch(`${INTERACTION_API}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, productId: product.id })
        })
            .then((res) => res.json())
            .then(() => {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                cart.push(product.id);
                localStorage.setItem('cart', JSON.stringify(cart));
                onCartUpdate();
                showToast(`${product.name} added to cart`);
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
            .then((res) => res.json())
            .then(() => {
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                if (!wishlist.includes(product.id)) wishlist.push(product.id);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                showToast(`${product.name} added to wishlist`);
            })
            .catch(() => showToast('Failed to add to wishlist', 'error'))
            .finally(() => setBusyKey(key, false));
    };

    const enterRaffle = (product) => {
        if (!user) return requireLogin();
        const currentStatus = raffleStatuses[product.id];

        if (currentStatus?.entered) {
            showToast('Already entered this raffle', 'error');
            return;
        }
        if (currentStatus?.raffleOver) {
            showToast(currentStatus.isWinner ? 'You already won this raffle' : 'This raffle is already over', 'error');
            return;
        }

        const key = `raffle_${product.id}`;
        setBusyKey(key, true);
        fetch(`${RAFFLE_API}/enter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, productId: product.id })
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to enter raffle');
                return data;
            })
            .then(() => fetch(`${RAFFLE_API}/status/${product.id}/${user.userId}`))
            .then((res) => res.json())
            .then((status) => {
                setRaffleStatuses((prev) => ({ ...prev, [product.id]: status }));
                showToast(`Entered ${product.name} raffle`);
            })
            .catch((error) => showToast(error.message || 'Failed to enter raffle', 'error'))
            .finally(() => setBusyKey(key, false));
    };

    const raffleProducts = products.filter((product) => product.raffleActive);
    const normalProducts = products.filter((product) => !product.raffleActive);
    const heroProduct = products.find((product) => product.image) || products[0];

    if (loading) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-icon">Loading</div>
                    <div className="empty-title">Loading Drops</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <section className="hero">
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-copy">
                            <div>
                                <div className="hero-meta">01. Current Collection</div>
                                <h1 className="hero-title">Modern Sneaker Retail, Stripped To Signal.</h1>
                                <p className="hero-sub">
                                    A cleaner Sneakertail interface built around product focus, harder typography, sharp structure, and the same shopping and raffle flows you already use.
                                </p>
                                <div className="hero-actions">
                                    <Link to="/cart" className="btn btn-primary">Open Cart</Link>
                                    {!user && <Link to="/login" className="btn btn-outline">Member Login</Link>}
                                </div>
                            </div>

                            <div className="hero-foot">
                                <div className="hero-stat">
                                    <span className="micro-label">Products</span>
                                    <strong>{products.length}</strong>
                                </div>
                                <div className="hero-stat">
                                    <span className="micro-label">Active Raffles</span>
                                    <strong>{raffleProducts.length}</strong>
                                </div>
                                <div className="hero-stat">
                                    <span className="micro-label">Ready To Buy</span>
                                    <strong>{normalProducts.length}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="hero-panel swiss-grid-pattern">
                            <div className="hero-visual">
                                {heroProduct ? (
                                    <>
                                        <ProductImage product={heroProduct} className="product-image hero-product-image" />
                                        <div className="hero-visual-copy">
                                            <div className="micro-label">{heroProduct.brand}</div>
                                            <div style={{ marginTop: 8, fontWeight: 900, textTransform: 'uppercase' }}>{heroProduct.name}</div>
                                            <div style={{ marginTop: 8 }}>${heroProduct.price}</div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="product-image-fallback">Sneakertail</div>
                                )}
                            </div>
                            <div className="hero-panel-grid">
                                <div className="hero-cell">
                                    <div>
                                        <span className="micro-label">Reference</span>
                                        <strong>Swiss</strong>
                                    </div>
                                </div>
                                <div className="hero-cell swiss-dots">
                                    <div>
                                        <span className="micro-label">Retail</span>
                                        <strong>Nike</strong>
                                    </div>
                                </div>
                                <div className="hero-cell swiss-diagonal">
                                    <div>
                                        <span className="micro-label">Mode</span>
                                        <strong>Shop</strong>
                                    </div>
                                </div>
                                <div className="hero-cell">
                                    <div>
                                        <span className="micro-label">State</span>
                                        <strong>Live</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {raffleProducts.length > 0 && (
                <section className="section">
                    <div className="container">
                        <div className="section-band">
                            <aside className="section-rail swiss-dots">
                                <div className="section-label">02. Raffles</div>
                                <div className="section-title">Entry Queue</div>
                                <p className="section-sub">Status is persistent now, so users see the real raffle state after reloads, tab changes, and winner draws.</p>
                            </aside>
                            <div className="section-content">
                                <div className="raffle-section">
                                    <div style={{ padding: '18px 18px 0' }}>
                                        <div className="raffle-section-title">
                                            Active Raffles
                                            <span className="section-badge">Live</span>
                                        </div>
                                        <p className="raffle-section-sub">Direct purchase stays off for raffle inventory. Entry status, winner state, and close state are now coming from the backend.</p>
                                    </div>
                                    <div className="raffle-grid">
                                        {raffleProducts.map((product) => {
                                            const status = raffleStatuses[product.id] || {};

                                            return (
                                                <article key={product.id} className="raffle-card">
                                                    <span className="raffle-badge">Raffle</span>
                                                    <ProductImage product={product} />
                                                    <div className="product-body">
                                                        <div className="product-brand">{product.brand}</div>
                                                        <div className="product-name">{product.name}</div>
                                                        <div className="product-desc">{product.description}</div>
                                                        {product.category && <span className="badge badge-gold">{product.category}</span>}
                                                    </div>
                                                    <div className="product-footer">
                                                        <div>
                                                            <div className="product-price">${product.price}</div>
                                                            <div className="product-stock">Entry only</div>
                                                        </div>
                                                    </div>
                                                    <div className="product-actions">
                                                        {status.isWinner ? (
                                                            <div className="raffle-entered-badge">You Won This Raffle</div>
                                                        ) : status.raffleOver ? (
                                                            <div className="raffle-entered-badge">Raffle Over</div>
                                                        ) : status.entered ? (
                                                            <div className="raffle-entered-badge">Entered - Good Luck</div>
                                                        ) : (
                                                            <button
                                                                className="btn btn-primary btn-full"
                                                                onClick={() => enterRaffle(product)}
                                                                disabled={busy[`raffle_${product.id}`]}
                                                            >
                                                                {busy[`raffle_${product.id}`] ? 'Working' : 'Enter Raffle'}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline btn-icon"
                                                            onClick={() => addToWishlist(product)}
                                                            disabled={busy[`wish_${product.id}`]}
                                                            title="Add to Wishlist"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="section">
                <div className="container">
                    <div className="section-band">
                        <aside className="section-rail swiss-grid-pattern">
                            <div className="section-label">03. Inventory</div>
                            <div className="section-title">Available Now</div>
                            <p className="section-sub">A flatter, retail-first layout inspired by the clarity of Nike category pages, but kept inside your existing product, cart, checkout, and admin logic.</p>
                        </aside>
                        <div className="section-content">
                            <div className="section-header">
                                <div>
                                    <div className="section-label">Shop Grid</div>
                                    <div className="section-title">All Sneakers</div>
                                </div>
                            </div>

                            {normalProducts.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">Inventory</div>
                                    <div className="empty-title">No Products Available</div>
                                    <div className="empty-sub">Check back soon for new drops.</div>
                                </div>
                            ) : (
                                <div className="product-grid">
                                    {normalProducts.map((product) => (
                                        <article key={product.id} className="product-card">
                                            <ProductImage product={product} />
                                            <div className="product-body">
                                                <div className="product-brand">{product.brand}</div>
                                                <div className="product-name">{product.name}</div>
                                                <div className="product-desc">{product.description}</div>
                                                {product.category && <span className="badge badge-green">{product.category}</span>}
                                            </div>
                                            <div className="product-footer">
                                                <div>
                                                    <div className="product-price">${product.price}</div>
                                                    <div className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
                                                </div>
                                            </div>
                                            <div className="product-actions">
                                                <button
                                                    className="btn btn-primary btn-full"
                                                    onClick={() => addToCart(product)}
                                                    disabled={busy[`cart_${product.id}`] || product.stock === 0}
                                                >
                                                    {busy[`cart_${product.id}`] ? 'Working' : 'Add to Cart'}
                                                </button>
                                                <button
                                                    className="btn btn-outline btn-icon"
                                                    onClick={() => addToWishlist(product)}
                                                    disabled={busy[`wish_${product.id}`]}
                                                    title="Add to Wishlist"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
