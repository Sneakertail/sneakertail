import React, { useEffect, useState } from 'react';

function Admin({ user, showToast }) {
    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const RAFFLE_API = process.env.REACT_APP_RAFFLE_API || '/api/raffle';

    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ name: '', brand: '', price: '', stock: '', category: 'Lifestyle', description: '', raffleActive: false });
    const [winners, setWinners] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        fetch(PRODUCT_API)
            .then(res => res.json())
            .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { showToast('Failed to load products', 'error'); setLoading(false); });
    }, [user]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Unauthorized</div>
                <div style={{ color: 'var(--text2)' }}>Please login as admin to access this page.</div>
            </div>
        );
    }

    const addProduct = (e) => {
        e.preventDefault();
        if (!form.name) { showToast('Product name is required', 'error'); return; }
        const payload = {
            name: form.name,
            brand: form.brand,
            price: Number(form.price) || 0,
            stock: Number(form.stock) || 0,
            category: form.category,
            description: form.description,
            raffleActive: !!form.raffleActive,
        };
        fetch(`${PRODUCT_API}/admin/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                setProducts(prev => [...prev, data.product || payload]);
                showToast('Product added! ✅');
                setForm({ name: '', brand: '', price: '', stock: '', category: 'Lifestyle', description: '', raffleActive: false });
            })
            .catch(() => showToast('Failed to add product', 'error'));
    };

    const deleteProduct = (product) => {
        if (!window.confirm(`Delete "${product.name}"?`)) return;
        fetch(`${PRODUCT_API}/admin/${product.id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                setProducts(prev => prev.filter(p => p.id !== product.id));
                showToast(`${product.name} deleted`);
            })
            .catch(() => showToast('Failed to delete', 'error'));
    };

    const drawWinner = (product) => {
        fetch(`${RAFFLE_API}/draw/${product.id}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.winner === null) {
                    showToast('No entries in this raffle yet', 'error');
                } else {
                    setWinners(w => ({ ...w, [product.id]: data }));
                    showToast(`Winner drawn for ${product.name}! 🎰`);
                }
            })
            .catch(() => showToast('Failed to draw winner', 'error'));
    };

    const raffleProducts = products.filter(p => p.raffleActive);
    const normalProducts = products.filter(p => !p.raffleActive);

    return (
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--text3)', textTransform: 'uppercase' }}>Admin</div>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Products', value: products.length, icon: '📦' },
                    { label: 'Active Raffles', value: raffleProducts.length, icon: '🎰' },
                    { label: 'Regular Stock', value: normalProducts.length, icon: '👟' },
                ].map(s => (
                    <div key={s.label} style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '16px 24px',
                        display: 'flex', alignItems: 'center', gap: 12
                    }}>
                        <span style={{ fontSize: 28 }}>{s.icon}</span>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add Product</button>
                <button className={`tab ${activeTab === 'raffle' ? 'active' : ''}`} onClick={() => setActiveTab('raffle')}>Raffle Draw</button>
            </div>

            {/* Products List */}
            {activeTab === 'products' && (
                <div>
                    <div style={{ marginBottom: 12, color: 'var(--text2)', fontSize: 13 }}>{products.length} products total</div>
                    {loading ? <div style={{ color: 'var(--text2)' }}>Loading...</div> : (
                        products.map(p => (
                            <div key={p.id} className="admin-product-row">
                                <div style={{ fontSize: 28 }}>👟</div>
                                <div className="admin-product-info">
                                    <div className="admin-product-name">{p.name}</div>
                                    <div className="admin-product-meta">{p.brand} · ${p.price} · Stock: {p.stock}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                                    {p.raffleActive && <span className="raffle-tag">🎰 RAFFLE</span>}
                                    <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p)}>Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add Product */}
            {activeTab === 'add' && (
                <div className="admin-panel">
                    <div className="admin-panel-title">Add New Product</div>
                    <div className="admin-panel-body">
                        <form onSubmit={addProduct}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Product Name *</label>
                                    <input className="form-input" placeholder="e.g. Air Jordan 1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Brand</label>
                                    <input className="form-input" placeholder="e.g. Nike" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price ($)</label>
                                    <input className="form-input" type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stock</label>
                                    <input className="form-input" type="number" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        <option>Lifestyle</option>
                                        <option>Basketball</option>
                                        <option>Running</option>
                                        <option>Collaboration</option>
                                        <option>Retro</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ justifyContent: 'center' }}>
                                    <label className="form-label">Raffle Product?</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.raffleActive}
                                            onChange={e => setForm({ ...form, raffleActive: e.target.checked })}
                                            style={{ width: 18, height: 18, accentColor: 'var(--gold2)' }}
                                        />
                                        <span style={{ fontWeight: 600, color: form.raffleActive ? 'var(--gold2)' : 'var(--text2)' }}>
                                            {form.raffleActive ? '🎰 Raffle Active' : 'Regular Product'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: 4 }}>
                                <label className="form-label">Description</label>
                                <input className="form-input" placeholder="Short product description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <button className="btn btn-primary" type="submit">Add Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Raffle Draw */}
            {activeTab === 'raffle' && (
                <div>
                    {raffleProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎰</div>
                            <div className="empty-title">No Active Raffles</div>
                            <div className="empty-sub">Create a raffle product in the "Add Product" tab.</div>
                        </div>
                    ) : raffleProducts.map(p => (
                        <div key={p.id} className="admin-panel" style={{ marginBottom: 16 }}>
                            <div className="admin-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🎰 {p.name}</span>
                                <span style={{ fontSize: 12, color: 'var(--text2)' }}>${p.price}</span>
                            </div>
                            <div className="admin-panel-body">
                                <button className="btn btn-gold" onClick={() => drawWinner(p)}>Draw Winner</button>
                                {winners[p.id] && (
                                    <div style={{
                                        marginTop: 16, padding: '16px',
                                        background: 'rgba(255,184,0,0.08)',
                                        border: '1px solid rgba(255,184,0,0.3)',
                                        borderRadius: 10
                                    }}>
                                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Winner</div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold2)' }}>
                                            👑 User #{winners[p.id].winnerUserId}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                                            from {winners[p.id].totalEntries} entries
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Admin;
