import React, { useEffect, useState } from 'react';

function Cart() {
    const [items, setItems] = useState([]);
    const PRODUCT_API = 'http://localhost:3002/api/products';

    useEffect(() => {
        const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cartIds.length === 0) {
            setItems([]);
            return;
        }
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(products => {
                const cartProducts = products.filter(p => cartIds.includes(p.id));
                setItems(cartProducts);
            });
    }, []);

    const clearCart = () => {
        localStorage.removeItem('cart');
        setItems([]);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Cart</h2>
            {items.length === 0 ? (
                <p>Cart is empty</p>
            ) : (
                <div>
                    {items.map(it => (
                        <div key={it.id}>{it.name} - ${it.price}</div>
                    ))}
                    <button onClick={clearCart} style={{ marginTop: 10 }}>Clear Cart</button>
                </div>
            )}
        </div>
    );
}

export default Cart;
