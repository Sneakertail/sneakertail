import React, { useEffect, useState } from 'react';

function ProductThumb({ product }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="admin-product-media">
            {product.image && !failed ? (
                <img src={product.image} alt={product.name} className="product-photo" onError={() => setFailed(true)} />
            ) : (
                <div className="product-image-fallback swiss-grid-pattern">{product.brand}</div>
            )}
        </div>
    );
}

function Admin({ user, showToast }) {
    const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || '/api/products';
    const RAFFLE_API = process.env.REACT_APP_RAFFLE_API || '/api/raffle';
    const PAYMENT_API = process.env.REACT_APP_PAYMENT_API || '/api/payment';

    const [products, setProducts] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [form, setForm] = useState({
        name: '',
        brand: '',
        price: '',
        stock: '',
        image: '',
        category: 'Lifestyle',
        description: '',
        raffleActive: false
    });
    const [winners, setWinners] = useState({});
    const [salesData, setSalesData] = useState({ totalRevenue: 0, totalOrders: 0, totalItemsSold: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');

    const hydrateDrafts = (productList) => {
        setDrafts(
            Object.fromEntries(productList.map((product) => [product.id, {
                price: product.price,
                stock: product.stock,
                image: product.image || '',
                raffleActive: product.raffleActive,
            }]))
        );
    };

    const loadDashboard = () => {
        Promise.all([
            fetch(PRODUCT_API).then((res) => res.json()),
            fetch(`${PAYMENT_API}/admin/sales`).then((res) => res.json()).catch(() => ({ totalRevenue: 0, totalOrders: 0, totalItemsSold: 0, transactions: [] })),
        ])
            .then(([productData, sales]) => {
                const safeProducts = Array.isArray(productData) ? productData : [];
                setProducts(safeProducts);
                hydrateDrafts(safeProducts);
                setSalesData({
                    totalRevenue: Number(sales.totalRevenue) || 0,
                    totalOrders: Number(sales.totalOrders) || 0,
                    totalItemsSold: Number(sales.totalItemsSold) || 0,
                    transactions: Array.isArray(sales.transactions) ? sales.transactions : [],
                });
                setLoading(false);
            })
            .catch(() => {
                showToast('Failed to load admin data', 'error');
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        loadDashboard();
    }, [user]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-icon">Admin</div>
                    <div className="empty-title">Unauthorized</div>
                    <div className="empty-sub">Please login as admin to access this page.</div>
                </div>
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
            image: form.image || null,
            category: form.category,
            description: form.description,
            raffleActive: !!form.raffleActive,
        };

        fetch(`${PRODUCT_API}/admin/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                const nextProducts = [...products, data.product || payload];
                setProducts(nextProducts);
                hydrateDrafts(nextProducts);
                showToast('Product added');
                setForm({ name: '', brand: '', price: '', stock: '', image: '', category: 'Lifestyle', description: '', raffleActive: false });
            })
            .catch(() => showToast('Failed to add product', 'error'));
    };

    const deleteProduct = (product) => {
        if (!window.confirm(`Delete "${product.name}"?`)) return;
        fetch(`${PRODUCT_API}/admin/${product.id}`, { method: 'DELETE' })
            .then((res) => res.json())
            .then(() => {
                const nextProducts = products.filter((entry) => entry.id !== product.id);
                setProducts(nextProducts);
                hydrateDrafts(nextProducts);
                showToast(`${product.name} deleted`);
            })
            .catch(() => showToast('Failed to delete', 'error'));
    };

    const saveProduct = (product) => {
        const draft = drafts[product.id];
        if (!draft) return;

        fetch(`${PRODUCT_API}/admin/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                price: Number(draft.price) || 0,
                stock: Number(draft.stock) || 0,
                image: draft.image || null,
                raffleActive: !!draft.raffleActive,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                const nextProducts = products.map((entry) => entry.id === product.id ? data.product : entry);
                setProducts(nextProducts);
                hydrateDrafts(nextProducts);
                showToast(`${product.name} updated`);
            })
            .catch(() => showToast('Failed to update product', 'error'));
    };

    const drawWinner = (product) => {
        fetch(`${RAFFLE_API}/draw/${product.id}`, { method: 'POST' })
            .then((res) => res.json())
            .then((data) => {
                if (data.winnerUserId === null) {
                    showToast('No entries in this raffle yet', 'error');
                } else {
                    setWinners((current) => ({ ...current, [product.id]: data }));
                    showToast(`Winner drawn for ${product.name}`);
                }
            })
            .catch(() => showToast('Failed to draw winner', 'error'));
    };

    const raffleProducts = products.filter((product) => product.raffleActive);
    const normalProducts = products.filter((product) => !product.raffleActive);

    return (
        <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
            <div className="page-header">
                <div className="section-label">08. Control</div>
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-sub">Product management, raffle lifecycle, stock edits, image URLs, and sales totals now live in the same visual system.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="micro-label">Products</span>
                    <strong>{products.length}</strong>
                </div>
                <div className="stat-card swiss-dots">
                    <span className="micro-label">Raffles</span>
                    <strong>{raffleProducts.length}</strong>
                </div>
                <div className="stat-card swiss-diagonal">
                    <span className="micro-label">Orders</span>
                    <strong>{salesData.totalOrders}</strong>
                </div>
                <div className="stat-card">
                    <span className="micro-label">Revenue</span>
                    <strong>${salesData.totalRevenue.toFixed(2)}</strong>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add Product</button>
                <button className={`tab ${activeTab === 'raffle' ? 'active' : ''}`} onClick={() => setActiveTab('raffle')}>Raffle Draw</button>
                <button className={`tab ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales</button>
            </div>

            {activeTab === 'products' && (
                <div>
                    {loading ? <div className="empty-state"><div className="empty-icon">Loading</div><div className="empty-title">Loading Products</div></div> : (
                        <div className="list-stack">
                            {products.map((product) => (
                                <article key={product.id} className="admin-product-row">
                                    <ProductThumb product={product} />
                                    <div className="admin-product-info">
                                        <div className="list-card-brand">{product.brand}</div>
                                        <div className="admin-product-name">{product.name}</div>
                                        <div className="admin-product-meta">Sold {product.soldCount || 0} · {product.category}</div>
                                        <div className="admin-inline-grid">
                                            <label className="form-group" style={{ marginBottom: 0 }}>
                                                <span className="form-label">Price</span>
                                                <input className="form-input" type="number" value={drafts[product.id]?.price ?? product.price} onChange={(e) => setDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], price: e.target.value } }))} />
                                            </label>
                                            <label className="form-group" style={{ marginBottom: 0 }}>
                                                <span className="form-label">Stock</span>
                                                <input className="form-input" type="number" value={drafts[product.id]?.stock ?? product.stock} onChange={(e) => setDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], stock: e.target.value } }))} />
                                            </label>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0, marginTop: 12 }}>
                                            <span className="form-label">Image URL</span>
                                            <input className="form-input" value={drafts[product.id]?.image ?? product.image ?? ''} onChange={(e) => setDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], image: e.target.value } }))} />
                                        </div>
                                    </div>
                                    <div className="admin-actions">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={!!(drafts[product.id]?.raffleActive ?? product.raffleActive)} onChange={(e) => setDrafts((prev) => ({ ...prev, [product.id]: { ...prev[product.id], raffleActive: e.target.checked } }))} />
                                            <span className="form-label" style={{ margin: 0 }}>Raffle</span>
                                        </label>
                                        {product.raffleActive && <span className="raffle-tag">Raffle</span>}
                                        <button className="btn btn-outline btn-sm" onClick={() => saveProduct(product)}>Save</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(product)}>Delete</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'add' && (
                <div className="admin-panel">
                    <div className="admin-panel-title">Add New Product</div>
                    <div className="admin-panel-body">
                        <form onSubmit={addProduct}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Brand</label>
                                    <input className="form-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price</label>
                                    <input className="form-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stock</label>
                                    <input className="form-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Image URL</label>
                                <input className="form-input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                        <option>Lifestyle</option>
                                        <option>Basketball</option>
                                        <option>Running</option>
                                        <option>Collaboration</option>
                                        <option>Retro</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ alignContent: 'end' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <input type="checkbox" checked={form.raffleActive} onChange={(e) => setForm({ ...form, raffleActive: e.target.checked })} />
                                        <span className="form-label" style={{ margin: 0 }}>Raffle Product</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>

                            <button className="btn btn-primary" type="submit">Add Product</button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'raffle' && (
                <div>
                    {raffleProducts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">Raffles</div>
                            <div className="empty-title">No Active Raffles</div>
                            <div className="empty-sub">Create or convert a product into a raffle from the product tabs.</div>
                        </div>
                    ) : (
                        raffleProducts.map((product) => (
                            <div key={product.id} className="admin-panel" style={{ marginBottom: 18 }}>
                                <div className="admin-panel-title">{product.name}</div>
                                <div className="admin-panel-body">
                                    <button className="btn btn-primary" onClick={() => drawWinner(product)}>Draw Winner</button>
                                    {winners[product.id] && (
                                        <div style={{ marginTop: 18, border: '2px solid var(--line)', padding: 16, background: 'var(--muted)' }}>
                                            <div className="micro-label">Winner</div>
                                            <div style={{ marginTop: 8, fontSize: '1.6rem', fontWeight: 900 }}>User #{winners[product.id].winnerUserId}</div>
                                            <div style={{ marginTop: 6 }}>From {winners[product.id].totalEntries} entries</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="admin-panel">
                    <div className="admin-panel-title">Sales Details</div>
                    <div className="admin-panel-body">
                        <div className="stats-grid" style={{ marginBottom: 20 }}>
                            <div className="stat-card">
                                <span className="micro-label">Revenue</span>
                                <strong>${salesData.totalRevenue.toFixed(2)}</strong>
                            </div>
                            <div className="stat-card swiss-dots">
                                <span className="micro-label">Orders</span>
                                <strong>{salesData.totalOrders}</strong>
                            </div>
                            <div className="stat-card swiss-diagonal">
                                <span className="micro-label">Items Sold</span>
                                <strong>{salesData.totalItemsSold}</strong>
                            </div>
                            <div className="stat-card">
                                <span className="micro-label">Regular Stock</span>
                                <strong>{normalProducts.length}</strong>
                            </div>
                        </div>

                        {salesData.transactions.length === 0 ? (
                            <div className="empty-state" style={{ padding: 0 }}>
                                <div className="empty-icon">Sales</div>
                                <div className="empty-title">No Completed Sales Yet</div>
                            </div>
                        ) : (
                            <div className="list-stack">
                                {salesData.transactions.map((transaction) => (
                                    <article key={transaction.transactionId} className="list-card">
                                        <div className="list-card-img swiss-diagonal">
                                            <div className="product-image-fallback">Sale</div>
                                        </div>
                                        <div className="list-card-info">
                                            <div className="list-card-brand">User #{transaction.userId}</div>
                                            <div className="list-card-name">{transaction.transactionId}</div>
                                            <div>{new Date(transaction.createdAt).toLocaleString()}</div>
                                            <div>{transaction.items.map((item) => `${item.name} x${item.qty}`).join(', ')}</div>
                                        </div>
                                        <div className="list-card-actions">
                                            <div className="micro-label">Total</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>${Number(transaction.amount).toFixed(2)}</div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
