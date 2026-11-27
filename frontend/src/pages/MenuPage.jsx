import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../services/api.js';
import './Menu.css';

const CATEGORIES = ['Coffee', 'Non-Coffee', 'Food', 'Pastry'];

const PRESET_ITEMS = {
    Coffee:     ['Americano', 'Cappuccino', 'Caramel Macchiato', 'Espresso', 'Latte', 'Mocha', 'Flat White', 'Affogato'],
    'Non-Coffee': ['Matcha Latte', 'Chocolate Milk', 'Strawberry Smoothie', 'Mango Shake', 'Iced Tea', 'Lemonade', 'Taro Milk Tea'],
    Food:       ['Club Sandwich', 'BLT Sandwich', 'Pasta Carbonara', 'Pasta Bolognese', 'Caesar Salad', 'Chicken Wrap', 'French Fries'],
    Pastry:     ['Cheese Cake', 'Chocolate Cake', 'Blueberry Muffin', 'Croissant', 'Cinnamon Roll', 'Brownie', 'Tiramisu'],
};
const EMPTY_FORM = { item_name: '', category: '', price: '', availability: 'Available' };

function MenuCard({ item, onEdit, onDelete }) {
    return (
        <div className={`menu-card ${item.availability === 'Unavailable' ? 'unavailable' : ''}`}>
            <div className="menu-card-header">
                <div>
                    <h4>{item.item_name}</h4>
                    <span className="menu-card-category">{item.category}</span>
                </div>
                <span className={`menu-status ${item.availability === 'Available' ? 'status-available' : 'status-unavailable'}`}>
                    {item.availability}
                </span>
            </div>

            <div className="menu-card-price">
                <span>Price</span>
                <strong>₱{Number(item.price).toFixed(2)}</strong>
            </div>

            <div className="menu-card-actions">
                <button className="btn btn-secondary" onClick={() => onEdit(item)}>Edit</button>
                <button className="btn btn-danger"    onClick={() => onDelete(item)}>Delete</button>
            </div>
        </div>
    );
}

export default function MenuPage({ onNavigate }) {
    const [items, setItems]         = useState([]);
    const [search, setSearch]       = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [toast, setToast]         = useState({ msg: '', type: '' });

    // Add / Edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm]           = useState(EMPTY_FORM);
    const [saving, setSaving]       = useState(false);

    // Delete confirm modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: '' }), 3000);
    }

    const loadItems = useCallback(async () => {
        try {
            const res = await apiFetch('/api/menu-items');
            if (!res) return;
            const result = await res.json();
            setItems(result.data || []);
        } catch (err) {
            showToast('Unable to load menu items.', 'error');
        }
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    // FILTER
    const categories = ['All', ...CATEGORIES];

    const filtered = items.filter(item => {
        const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
        const matchCat    = filterCat === 'All' || item.category === filterCat;
        return matchSearch && matchCat;
    });

    // GROUP BY CATEGORY
    const grouped = {};
    filtered.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    // SUMMARY COUNTS
    const available   = items.filter(i => i.availability === 'Available').length;
    const unavailable = items.filter(i => i.availability === 'Unavailable').length;

    // ADD / EDIT
    function openAdd() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    }

    function openEdit(item) {
        setEditingId(item.menu_id);
        setForm({
            item_name:    item.item_name,
            category:     item.category,
            price:        item.price,
            availability: item.availability,
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
        const { item_name, category, price, availability } = form;

        if (!item_name.trim() || !category || price === '') {
            showToast('Please complete all fields.', 'error'); return;
        }
        if (isNaN(Number(price)) || Number(price) < 0) {
            showToast('Price must be a valid positive number.', 'error'); return;
        }

        setSaving(true);
        try {
            const body = {
                item_name:    item_name.trim(),
                category,
                price:        Number(price),
                availability,
            };

            const res = await apiFetch(
                editingId ? `/api/menu-items/${editingId}` : '/api/menu-items',
                { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) }
            );
            if (!res) return;
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);

            closeModal();
            await loadItems();
            showToast(editingId ? 'Menu item updated!' : 'Menu item added!');
        } catch (err) {
            showToast(err.message || 'Failed to save.', 'error');
        } finally {
            setSaving(false);
        }
    }

    // DELETE
    function openDelete(item) {
        setDeleteTarget(item);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await apiFetch(`/api/menu-items/${deleteTarget.menu_id}`, { method: 'DELETE' });
            if (!res) return;
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);
            setDeleteTarget(null);
            await loadItems();
            showToast(`"${deleteTarget.item_name}" deleted.`);
        } catch (err) {
            showToast(err.message || 'Failed to delete.', 'error');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="page-layout">
            <Sidebar currentPage="menu" onNavigate={onNavigate} />

            <main className="main-content">
                <header className="topbar">
                    <div className="page-title">
                        <h1>Menu Management</h1>
                        <p>Manage your cafe menu items and prices</p>
                    </div>
                    <div className="admin-profile">
                        <div className="admin-info">
                            <h4>Where every sip</h4>
                            <p>feels like home.</p>
                        </div>
                    </div>
                </header>

                {/* SUMMARY CARDS */}
                <section className="menu-summary">
                    <div className="dashboard-card">
                        <p className="card-label">Total Items</p>
                        <h2 className="card-value">{items.length}</h2>
                        <p className="card-description">All menu items</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Available</p>
                        <h2 className="card-value">{available}</h2>
                        <p className="card-description">Items on the menu</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Unavailable</p>
                        <h2 className="card-value">{unavailable}</h2>
                        <p className="card-description">Items not on the menu</p>
                    </div>
                </section>

                {/* MENU SECTION */}
                <section className="dashboard-section menu-section">
                    <div className="menu-section-header">
                        <div className="menu-heading">
                            <h2>Menu Items</h2>
                            <p>View and manage your cafe menu</p>
                        </div>
                        <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
                    </div>

                    {/* TOOLBAR */}
                    <div className="menu-toolbar">
                        <div className="menu-category-filter">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`cat-filter-btn${filterCat === cat ? ' active' : ''}`}
                                    onClick={() => setFilterCat(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            className="menu-search"
                            placeholder="Search menu items..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* GROUPED ITEMS */}
                    {filtered.length === 0 ? (
                        <div className="empty-state">No menu items found.</div>
                    ) : (
                        Object.entries(grouped).map(([category, catItems]) => (
                            <div key={category} className="menu-group">
                                <div className="menu-group-header">
                                    <h3>{category}</h3>
                                    <span>{catItems.length} {catItems.length === 1 ? 'item' : 'items'}</span>
                                </div>
                                <div className="menu-items-grid">
                                    {catItems.map(item => (
                                        <MenuCard
                                            key={item.menu_id}
                                            item={item}
                                            onEdit={openEdit}
                                            onDelete={openDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>

            {/* ADD / EDIT MODAL */}
            {modalOpen && (
                <div className="menu-modal" onClick={closeModal}>
                    <div className="menu-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                                <p>{editingId ? 'Update the details of this menu item.' : 'Enter the details of the new menu item.'}</p>
                            </div>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>

                        <form onSubmit={handleSave} noValidate>
                            <div className="form-group">
                                <label>Item Name</label>
                                <input
                                    type="text"
                                    list="item-name-suggestions"
                                    placeholder="Select or type item name"
                                    value={form.item_name}
                                    onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                                    required
                                    autoComplete="off"
                                />
                                <datalist id="item-name-suggestions">
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
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Price (₱)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.price}
                                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Availability</label>
                                <select
                                    value={form.availability}
                                    onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                                >
                                    <option value="Available">Available</option>
                                    <option value="Unavailable">Unavailable</option>
                                </select>
                            </div>

                            <div className="modal-buttons">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-save" disabled={saving}>
                                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {deleteTarget && (
                <div className="menu-modal" onClick={() => setDeleteTarget(null)}>
                    <div className="menu-modal-content menu-modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Delete Menu Item</h2>
                                <p>This action cannot be undone.</p>
                            </div>
                            <button className="modal-close" onClick={() => setDeleteTarget(null)}>&times;</button>
                        </div>
                        <p className="delete-confirm-msg">
                            Are you sure you want to delete <strong>"{deleteTarget.item_name}"</strong>?
                        </p>
                        <div className="modal-buttons">
                            <button type="button" className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button type="button" className="btn-delete" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast.msg && (
                <div className={`menu-toast ${toast.type}`}>{toast.msg}</div>
            )}
        </div>
    );
}
