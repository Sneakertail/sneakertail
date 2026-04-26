import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

function ProductThumb({ product }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="list-card-img">
            {product.image && !failed ? (
                <img src={product.image} alt={product.name} className="product-photo" onError={() => setFailed(true)} />
            ) : (
                <div className="product-image-fallback swiss-grid-pattern">{product.brand}</div>
            )}
        </div>
    );
}

function Wishlist({ user, showToast, onCartUpdate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState({});

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const INTERACTION_API = process.env.REACT_APP_INTERACTION_API || '/api';

    const loadWishlist = useCallback(() => {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (wishlistIds.length === 0) { setItems([]); setLoading(false); return; }
        fetch(PRODUCT_API)
            .then((res) => res.json())
            .then((products) => {
                const wishlistProducts = wishlistIds.map((id) => products.find((entry) => entry.id === id)).filter(Boolean);
                setItems(wishlistProducts);
                setLoading(false);
            })
            .catch(() => { showToast('Failed to load wishlist', 'error'); setLoading(false); });
    }, [PRODUCT_API, showToast]);

    useEffect(() => { loadWishlist(); }, [loadWishlist]);

    const removeFromWishlist = (product) => {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        localStorage.setItem('wishlist', JSON.stringify(wishlist.filter((id) => id !== product.id)));

        if (user) {
            fetch(`${INTERACTION_API}/wishlist/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, productId: product.id })
            }).catch(console.error);
        }

        setItems((prev) => prev.filter((entry) => entry.id !== product.id));
        showToast(`${product.name} removed from wishlist`);
    };

    const moveToCart = (product) => {
        if (!user) { showToast('Please login first', 'error'); return; }
        if (product.raffleActive) { showToast('Raffle items cannot be added to cart', 'error'); return; }

        const key = `cart_${product.id}`;
        setBusy((current) => ({ ...current, [key]: true }));

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

                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                localStorage.setItem('wishlist', JSON.stringify(wishlist.filter((id) => id !== product.id)));
                if (user) {
                    fetch(`${INTERACTION_API}/wishlist/remove`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.userId, productId: product.id })
                    }).catch(console.error);
                }

                setItems((prev) => prev.filter((entry) => entry.id !== product.id));
                onCartUpdate();
                showToast(`${product.name} moved to cart`);
            })
            .catch(() => showToast('Failed to add to cart', 'error'))
            .finally(() => setBusy((current) => ({ ...current, [key]: false })));
    };

    if (loading) {
        return <div className="container"><div className="empty-state"><div className="empty-icon">Loading</div><div className="empty-title">Loading Wishlist</div></div></div>;
    }

    return (
        <div className="container">
            <div className="page-header">
                <div className="section-label">05. Saved</div>
                <h1 className="page-title">Wishlist</h1>
                <p className="page-sub">{items.length} saved item{items.length !== 1 ? 's' : ''} ready to revisit.</p>
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">Saved</div>
                    <div className="empty-title">Wishlist Is Empty</div>
                    <div className="empty-sub">Save products here, then move them into the cart when you are ready.</div>
                    <Link to="/" className="btn btn-primary">Explore Products</Link>
                </div>
            ) : (
                <div className="list-stack">
                    {items.map((item) => (
                        <article key={item.id} className="list-card">
                            <ProductThumb product={item} />
                            <div className="list-card-info">
                                <div className="list-card-brand">{item.brand}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                    <div className="list-card-name">{item.name}</div>
                                    {item.raffleActive && <span className="badge badge-gold">Raffle</span>}
                                </div>
                                <div>{item.category}</div>
                                <div className="list-card-price">${item.price}</div>
                            </div>
                            <div className="list-card-actions">
                                {!item.raffleActive ? (
                                    <button className="btn btn-primary btn-sm" onClick={() => moveToCart(item)} disabled={busy[`cart_${item.id}`]}>
                                        {busy[`cart_${item.id}`] ? 'Working' : 'Move To Cart'}
                                    </button>
                                ) : (
                                    <Link to="/" className="btn btn-primary btn-sm">Open Raffle</Link>
                                )}
                                <button className="btn btn-danger btn-sm" onClick={() => removeFromWishlist(item)}>Remove</button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Wishlist;
