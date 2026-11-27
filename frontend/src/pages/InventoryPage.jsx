import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../services/api.js';
import './Inventory.css';

const API = 'http://localhost:3000/api/inventory';

const EMPTY_FORM = { item_name: '', category: '', quantity: '', unit: '', minimum_stock: '' };

const PRESET_ITEMS = {
    Utensils:   ['Spoon', 'Fork'],
    Beverage:   ['Cup', 'Cup Dome', 'Straw'],
    Containers: ['Food Box', 'Paper Bag'],
    Amenities:  ['Tissue'],
};

const PRESET_UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'pack', 'box', 'sachet', 'bottle', 'bag', 'roll', 'dozen'];

function getStatus(item) {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.minimum_stock ?? 0);
    if (qty <= 0)   return { label: 'Out of Stock', className: 'status-out',    group: 'out' };
    if (qty <= min) return { label: 'Low Stock',    className: 'status-low',    group: 'low' };
    return              { label: 'Normal',          className: 'status-normal', group: 'normal' };
}

function InventoryCard({ item, onEdit }) {
    const status = getStatus(item);
    return (
        <div className={`inv-card ${status.group}-item`}>
            <div className="inv-card-header">
                <div>
                    <h4>{item.item_name}</h4>
                    <p>{item.category}</p>
                </div>
                <span className={`status ${status.className}`}>{status.label}</span>
            </div>
            <div className="inv-card-details">
                <div className="inv-detail">
                    <span>Quantity</span>
                    <strong>{item.quantity} {item.unit}</strong>
                </div>
                <div className="inv-detail">
                    <span>Minimum Stock</span>
                    <strong>{item.minimum_stock} {item.unit}</strong>
                </div>
            </div>
            <div className="inv-card-actions">
                <button className="btn btn-secondary" onClick={() => onEdit(item)}>Edit Item</button>
            </div>
        </div>
    );
}

function InventoryGroup({ title, subtitle, items, countId, onEdit }) {
    return (
        <section className="inv-status-section">
            <div className="inv-status-header">
                <div>
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
                <span className="inv-group-count">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
            </div>
            <div className="inv-items-grid">
                {items.length === 0
                    ? <div className="empty-state">No {title.toLowerCase()} items.</div>
                    : items.map(item => <InventoryCard key={item.item_id} item={item} onEdit={onEdit} />)
                }
            </div>
        </section>
    );
}

export default function InventoryPage({ onNavigate }) {
    const [items, setItems]           = useState([]);
    const [search, setSearch]         = useState('');
    const [toast, setToast]           = useState({ msg: '', type: '' });

    // Add/Edit modal
    const [modalOpen, setModalOpen]   = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [form, setForm]             = useState(EMPTY_FORM);

    // Stock-In modal
    const [stockInOpen, setStockInOpen]     = useState(false);
    const [stockInId, setStockInId]         = useState('');
    const [stockInQty, setStockInQty]       = useState('');
    const [stockInCurrent, setStockInCurrent] = useState('');

    // Stock Usage modal
    const [usageOpen, setUsageOpen]         = useState(false);
    const [usageId, setUsageId]             = useState('');
    const [usageQty, setUsageQty]           = useState('');
    const [usageCurrent, setUsageCurrent]   = useState('');
    const [usageReason, setUsageReason]     = useState('');

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: '' }), 3000);
    }

    const loadItems = useCallback(async () => {
        try {
            const res = await apiFetch('/api/inventory');
            if (!res) return;
            const result = await res.json();
            const data = result.success ? result.data : (Array.isArray(result) ? result : []);
            setItems(data);
        } catch (err) {
            showToast('Unable to load inventory.', 'error');
        }
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    const groups = { out: [], low: [], normal: [] };
    filtered.forEach(item => groups[getStatus(item).group].push(item));

    // ADD / EDIT
    function openAdd() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    }

    function openEdit(item) {
        setEditingId(item.item_id);
        setForm({
            item_name:     item.item_name,
            category:      item.category,
            quantity:      item.quantity,
            unit:          item.unit,
            minimum_stock: item.minimum_stock,
        });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setForm(EMPTY_FORM);
        setEditingId(null);
    }

    async function handleSave(e) {
        e.preventDefault();
        const { item_name, category, quantity, unit, minimum_stock } = form;

        if (!item_name.trim() || !category.trim() || quantity === '' || !unit.trim() || minimum_stock === '') {
            showToast('Please complete all fields.', 'error'); return;
        }

        const duplicate = items.some(i =>
            i.item_name.toLowerCase() === item_name.trim().toLowerCase() &&
            i.item_id !== editingId
        );
        if (duplicate) { showToast('Item already exists.', 'error'); return; }

        const body = { item_name: item_name.trim(), category: category.trim(), quantity: Number(quantity), unit: unit.trim(), minimum_stock: Number(minimum_stock) };

        try {
            const res = await apiFetch(
                editingId ? `/api/inventory/${editingId}` : '/api/inventory',
                { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) }
            );
            if (!res) return;
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);
            closeModal();
            await loadItems();
            showToast(editingId ? 'Inventory item updated!' : 'Inventory item added!');
        } catch (err) {
            showToast(err.message || 'Failed to save.', 'error');
        }
    }

    // STOCK-IN
    function openStockIn() {
        if (!items.length) { showToast('Add an inventory item first.', 'error'); return; }
        setStockInId(''); setStockInQty(''); setStockInCurrent('');
        setStockInOpen(true);
    }

    function handleStockInSelect(id) {
        setStockInId(id);
        const item = items.find(i => i.item_id === Number(id));
        setStockInCurrent(item ? `${item.quantity} ${item.unit}` : '');
    }

    async function handleStockIn(e) {
        e.preventDefault();
        if (!stockInId) { showToast('Select an item.', 'error'); return; }
        if (!stockInQty || Number(stockInQty) <= 0) { showToast('Enter a valid quantity.', 'error'); return; }
        const item = items.find(i => i.item_id === Number(stockInId));
        try {
            const res = await apiFetch(`/api/inventory/${stockInId}/stock-in`, {
                method: 'POST',
                body: JSON.stringify({ quantity_received: Number(stockInQty) })
            });
            if (!res) return;
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);
            setStockInOpen(false);
            await loadItems();
            showToast(`Stock-In successful! +${stockInQty} ${item?.unit || ''}`);
        } catch (err) {
            showToast(err.message || 'Stock-In failed.', 'error');
        }
    }

    // STOCK USAGE
    function openUsage() {
        if (!items.length) { showToast('Add an inventory item first.', 'error'); return; }
        setUsageId(''); setUsageQty(''); setUsageCurrent(''); setUsageReason('');
        setUsageOpen(true);
    }

    function handleUsageSelect(id) {
        setUsageId(id);
        const item = items.find(i => i.item_id === Number(id));
        setUsageCurrent(item ? `${item.quantity} ${item.unit}` : '');
    }

    async function handleUsage(e) {
        e.preventDefault();
        if (!usageId) { showToast('Select an item.', 'error'); return; }
        if (!usageQty || Number(usageQty) <= 0) { showToast('Enter a valid quantity.', 'error'); return; }
        const item = items.find(i => i.item_id === Number(usageId));
        try {
            const res = await apiFetch(`/api/inventory/${usageId}/stock-usage`, {
                method: 'POST',
                body: JSON.stringify({ quantity_used: Number(usageQty), remarks: usageReason || null })
            });
            if (!res) return;
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);
            setUsageOpen(false);
            await loadItems();
            showToast(`Stock Usage recorded! -${usageQty} ${item?.unit || ''}${usageReason ? ` | ${usageReason}` : ''}`);
        } catch (err) {
            showToast(err.message || 'Stock Usage failed.', 'error');
        }
    }

    return (
        <div className="page-layout">
            <Sidebar currentPage="inventory" onNavigate={onNavigate} />

            <main className="main-content">
                <header className="topbar">
                    <div className="page-title">
                        <h1>Inventory Management</h1>
                        <p>Manage and monitor your coffee shop supplies</p>
                    </div>
                    <div className="admin-profile">
                        <div className="admin-info">
                            <h4>Where every sip</h4>
                            <p>feels like home.</p>
                        </div>
                    </div>
                </header>

                {/* SUMMARY CARDS */}
                <section className="inv-summary">
                    <div className="dashboard-card">
                        <p className="card-label">Out of Stock</p>
                        <h2 className="card-value">{groups.out.length}</h2>
                        <p className="card-description">Items with zero quantity</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Low Stock</p>
                        <h2 className="card-value">{groups.low.length}</h2>
                        <p className="card-description">Items needing restock</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Normal</p>
                        <h2 className="card-value">{groups.normal.length}</h2>
                        <p className="card-description">Items with sufficient stock</p>
                    </div>
                </section>

                <section className="dashboard-section inv-section">
                    <div className="inv-section-header">
                        <div className="inv-heading">
                            <h2>Inventory Items</h2>
                            <p>View and manage your available supplies</p>
                        </div>
                        <div className="inv-actions">
                            <button className="btn btn-secondary" onClick={openStockIn}>Stock-In</button>
                            <button className="btn btn-secondary" onClick={openUsage}>Stock Usage</button>
                            <button className="btn btn-primary"   onClick={openAdd}>+ Add Item</button>
                        </div>
                    </div>

                    <div className="inv-toolbar">
                        <input
                            type="text"
                            placeholder="Search inventory item..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <InventoryGroup title="Out of Stock" subtitle="Items that need immediate replenishment" items={groups.out}    onEdit={openEdit} />
                    <InventoryGroup title="Low Stock"    subtitle="Items that are running low"             items={groups.low}    onEdit={openEdit} />
                    <InventoryGroup title="Normal Stock" subtitle="Items with sufficient quantity"         items={groups.normal} onEdit={openEdit} />
                </section>
            </main>

            {/* ADD / EDIT MODAL */}
            {modalOpen && (
                <div className="inv-modal" onClick={closeModal}>
                    <div className="inv-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
                                <p>{editingId ? 'Update the details of your inventory item.' : 'Enter the details of your inventory item.'}</p>
                            </div>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSave} noValidate>
                            <div className="form-group">
                                <label>Item Name</label>
                                <input
                                    type="text"
                                    list="inv-name-suggestions"
                                    placeholder="Select or type item name"
                                    value={form.item_name}
                                    onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                                    autoComplete="off"
                                    required
                                />
                                <datalist id="inv-name-suggestions">
                                    {(form.category && PRESET_ITEMS[form.category]
                                        ? PRESET_ITEMS[form.category]
                                        : Object.values(PRESET_ITEMS).flat()
                                    ).map(name => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                                    <option value="">Select Category</option>
                                    <option value="Utensils">Utensils</option>
                                    <option value="Beverage">Beverage</option>
                                    <option value="Containers">Containers</option>
                                    <option value="Amenities">Amenities</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" min="0" step="any" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <input
                                        type="text"
                                        list="inv-unit-suggestions"
                                        placeholder="Select or type unit"
                                        value={form.unit}
                                        onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                        autoComplete="off"
                                        required
                                    />
                                    <datalist id="inv-unit-suggestions">
                                        {PRESET_UNITS.map(u => (
                                            <option key={u} value={u} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Minimum Stock</label>
                                <input type="number" min="0" step="any" value={form.minimum_stock} onChange={e => setForm(f => ({ ...f, minimum_stock: e.target.value }))} required />
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-save">{editingId ? 'Save Changes' : 'Save Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STOCK-IN MODAL */}
            {stockInOpen && (
                <div className="inv-modal" onClick={() => setStockInOpen(false)}>
                    <div className="inv-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div><h2>Stock-In</h2><p>Record newly received inventory supplies.</p></div>
                            <button className="modal-close" onClick={() => setStockInOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleStockIn} noValidate>
                            <div className="form-group">
                                <label>Select Inventory Item</label>
                                <select value={stockInId} onChange={e => handleStockInSelect(e.target.value)} required>
                                    <option value="">Choose an item</option>
                                    {items.map(i => <option key={i.item_id} value={i.item_id}>{i.item_name} ({i.quantity} {i.unit})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Current Stock</label>
                                <input type="text" value={stockInCurrent} readOnly placeholder="Select an item first" />
                            </div>
                            <div className="form-group">
                                <label>Quantity Received</label>
                                <input type="number" min="0.01" step="any" value={stockInQty} onChange={e => setStockInQty(e.target.value)} required />
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-cancel" onClick={() => setStockInOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-save">Confirm Stock-In</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STOCK USAGE MODAL */}
            {usageOpen && (
                <div className="inv-modal" onClick={() => setUsageOpen(false)}>
                    <div className="inv-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div><h2>Stock Usage</h2><p>Record inventory items used.</p></div>
                            <button className="modal-close" onClick={() => setUsageOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUsage} noValidate>
                            <div className="form-group">
                                <label>Select Item</label>
                                <select value={usageId} onChange={e => handleUsageSelect(e.target.value)} required>
                                    <option value="">Choose inventory item</option>
                                    {items.map(i => <option key={i.item_id} value={i.item_id}>{i.item_name} ({i.quantity} {i.unit})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Current Stock</label>
                                <input type="text" value={usageCurrent} readOnly placeholder="Current stock will appear here" />
                            </div>
                            <div className="form-group">
                                <label>Quantity Used</label>
                                <input type="number" min="0.01" step="any" value={usageQty} onChange={e => setUsageQty(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Reason / Notes</label>
                                <input type="text" placeholder="e.g. Daily coffee preparation" value={usageReason} onChange={e => setUsageReason(e.target.value)} />
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-cancel" onClick={() => setUsageOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-save">Confirm Usage</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast.msg && (
                <div className={`inv-toast ${toast.type}`}>{toast.msg}</div>
            )}
        </div>
    );
}
