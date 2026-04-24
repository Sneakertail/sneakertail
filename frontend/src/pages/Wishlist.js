import React, { useEffect, useState } from 'react';

function Wishlist() {
    const [items, setItems] = useState([]);
    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || 'http://localhost:3002/api/products';

    useEffect(() => {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (wishlistIds.length === 0) {
            setItems([]);
            return;
        }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                const wishlistProducts = products.filter(p => wishlistIds.includes(p.id));
                setItems(wishlistProducts);
            });
    }, []);

    const clearWishlist = () => {
        localStorage.removeItem('wishlist');
        setItems([]);
    };

    return (
        <div className="container" style={{ padding: 20 }}>
            <h2>Wishlist</h2>
            {items.length === 0 ? (
                <p>Wishlist is empty</p>
            ) : (
                <div>
                    {items.map(it => (
                        <div key={it.id}>{it.name} - ${it.price}</div>
                    ))}
                    <button onClick={clearWishlist} style={{ marginTop: 10 }} className="btn">Clear Wishlist</button>
                </div>
            )}
        </div>
    );
}

export default Wishlist;
