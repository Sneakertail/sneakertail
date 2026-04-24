import React, { useEffect, useState } from 'react';

function Admin({ user, setMessage }) {
    if (!user || user.role !== 'admin') {
        return (
            <div className="container">
                <div style={{ padding: 20 }}>Unauthorized — please login as admin.</div>
            </div>
        );
    }

    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || 'http://localhost:3002/api/products';
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ id: '', name: '', price: '', stock: '', raffleActive: false });

    useEffect(() => {
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(setProducts)
            .catch(console.error);
    }, [PRODUCT_API]);

    const addProduct = (e) => {
        e.preventDefault();
        const payload = {
            id: Number(form.id) || Date.now(),
            name: form.name,
            price: Number(form.price) || 0,
            stock: Number(form.stock) || 0,
            raffleActive: !!form.raffleActive,
        };

        fetch(`${PRODUCT_API}/admin/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(() => {
                setProducts(prev => [...prev, payload]);
                setMessage('Product added');
                setForm({ id: '', name: '', price: '', stock: '', raffleActive: false });
                setTimeout(() => setMessage(''), 3000);
            })
            .catch(() => setMessage('Add failed'));
    };

    return (
        <div className="container" style={{ padding: 20 }}>
            <h2>Admin Dashboard</h2>

            <div className="admin-panel">
                <form onSubmit={addProduct} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input placeholder="ID (optional)" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
                    <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    <input placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={form.raffleActive} onChange={e => setForm({ ...form, raffleActive: e.target.checked })} /> Raffle
                    </label>
                    <button className="btn btn-primary" type="submit">Add Product</button>
                </form>
            </div>

            <h3 style={{ marginTop: 20 }}>Products</h3>
            <ul>
                {products.map(p => (
                    <li key={p.id}>{p.name} - ${p.price} {p.raffleActive ? '(Raffle)' : ''}</li>
                ))}
            </ul>
        </div>
    );
}

export default Admin;
