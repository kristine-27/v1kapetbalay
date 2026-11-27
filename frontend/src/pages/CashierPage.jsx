import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../services/api.js';
import './Cashier.css';

const DRINK_CATS = new Set(['coffee', 'non-coffee']);
const isDrink = item => DRINK_CATS.has(String(item.category || '').trim().toLowerCase());
const cartKey = (id, size) => `${id}:${size || 'none'}`;

function escapeHTML(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}

function createKey() {
    return window.crypto?.randomUUID?.() || `kb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CashierPage({ onNavigate }) {
    const [menuItems, setMenuItems]       = useState([]);
    const [search, setSearch]             = useState('');
    const [activeCategory, setActiveCat]  = useState('All');
    const [cart, setCart]                 = useState([]);
    const [orderType, setOrderType]       = useState('');
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [cashReceived, setCashReceived] = useState('');
    const [processing, setProcessing]     = useState(false);
    const [idempKey, setIdempKey]         = useState(null);
    const [toast, setToast]               = useState({ msg: '', type: '' });
    const [errorModal, setErrorModal]     = useState({ open: false, msg: '' });
    const [cashAlert, setCashAlert]       = useState(false);

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: '' }), 2800);
    }

    const loadMenu = useCallback(async () => {
        try {
            const res = await apiFetch('/api/menu-items');
            if (!res) return;
            const result = await res.json();
            setMenuItems((result.data || []).filter(i => i.availability === 'Available'));
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { loadMenu(); }, [loadMenu]);

    const categories = ['All', ...new Set(menuItems.map(i => i.category))];

    const filtered = menuItems.filter(item =>
        item.item_name.toLowerCase().includes(search.toLowerCase()) &&
        (activeCategory === 'All' || item.category === activeCategory)
    );

    function addToCart(item, drinkSize) {
        if (isDrink(item) && !['22oz', '24oz'].includes(drinkSize)) { alert('Please select 22oz or 24oz.'); return; }
        setIdempKey(null);
        const key = cartKey(item.menu_id, drinkSize);
        setCart(prev => {
            const existing = prev.find(c => c.key === key);
            if (existing) return prev.map(c => c.key === key ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, { key, menu_id: Number(item.menu_id), item_name: item.item_name, category: item.category, price: Number(item.price), quantity: 1, drink_size: drinkSize }];
        });
    }

    function changeQty(key, delta) {
        setIdempKey(null);
        setCart(prev => {
            const updated = prev.map(c => c.key === key ? { ...c, quantity: c.quantity + delta } : c);
            return updated.filter(c => c.quantity > 0);
        });
    }

    function removeItem(key) { setIdempKey(null); setCart(prev => prev.filter(c => c.key !== key)); }

    function clearCart() { setCart([]); setOrderType(''); setIdempKey(null); }

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const change = Math.max(Number(cashReceived) - total, 0);
    const checkoutDisabled = !cart.length || !orderType || processing;

    function openCheckout() {
        if (!cart.length || !orderType) return;
        setCashReceived('');
        setCheckoutOpen(true);
    }

    async function confirmOrder() {
        if (processing || !cart.length || !orderType) return;
        const cash = Number(cashReceived);
        if (!cashReceived || !Number.isFinite(cash) || cash <= 0) { alert('Please enter the cash received.'); return; }
        if (cash < total) { setCashAlert(true); return; }

        const key = idempKey || createKey();
        if (!idempKey) setIdempKey(key);

        setProcessing(true);
        try {
            const res = await apiFetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    items: cart.map(i => ({ menu_id: i.menu_id, quantity: i.quantity, drink_size: i.drink_size })),
                    order_type: orderType,
                    idempotency_key: key,
                }),
            });
            if (!res) return;
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || result.message || 'Failed to save order.');

            const num = result.data?.daily_order_number;
            showToast(`Order #${num} (${orderType}) saved successfully!`);
            setCart([]); setOrderType(''); setIdempKey(null);
            setCheckoutOpen(false);
        } catch (err) {
            setErrorModal({ open: true, msg: err.message });
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="page-layout">
            <Sidebar currentPage="cashier" onNavigate={onNavigate} />

            <main className="main-content">
                <header className="topbar">
                    <div className="page-title">
                        <h1>Cashier / POS</h1>
                        <p>Manage customer orders and transactions</p>
                    </div>
                    <div className="admin-profile">
                        <div className="admin-info"><h4>Where every sip</h4><p>feels like home</p></div>
                    </div>
                </header>

                <section className="pos-container">
                    {/* MENU */}
                    <div className="pos-menu-section">
                        <div className="pos-section-header">
                            <h2>Menu Items</h2>
                            <p>Select products to add to the order</p>
                        </div>
                        <div className="pos-search-container">
                            <input type="text" placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="pos-category-filter">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`category-btn${activeCategory === cat ? ' active' : ''}`}
                                    onClick={() => setActiveCat(cat)}
                                >{cat}</button>
                            ))}
                        </div>
                        <div className="pos-menu-grid">
                            {filtered.length === 0
                                ? <div className="menu-empty-state"><h3>No menu items found</h3><p>Try another search or category.</p></div>
                                : filtered.map(item => (
                                    <article key={`${item.menu_id}`} className="pos-menu-card">
                                        <div>
                                            <span className="menu-category">{item.category}</span>
                                            <h3>{item.item_name}</h3>
                                            <p className="menu-price">₱{Number(item.price).toFixed(2)}</p>
                                        </div>
                                        {isDrink(item) ? (
                                            <div className="drink-size-picker">
                                                <span className="drink-size-label">Choose drink size</span>
                                                <div className="drink-size-options">
                                                    <button type="button" className="drink-size-btn" onClick={() => addToCart(item, '22oz')}>22oz</button>
                                                    <button type="button" className="drink-size-btn" onClick={() => addToCart(item, '24oz')}>24oz</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button type="button" className="add-to-cart-btn" onClick={() => addToCart(item, null)}>+ Add to Order</button>
                                        )}
                                    </article>
                                ))
                            }
                        </div>
                    </div>

                    {/* CART */}
                    <div className="pos-cart-section">
                        <div className="pos-cart-header">
                            <h2>Current Order</h2>
                            <button type="button" className="clear-cart-btn" onClick={clearCart} disabled={!cart.length || processing}>Clear</button>
                        </div>

                        <div className="order-type-section">
                            <h3>Order Type</h3>
                            <p>Select how the customer will receive the order.</p>
                            <div className="order-type-options">
                                <button type="button" className={`order-type-btn${orderType === 'Dine In' ? ' active' : ''}`} onClick={() => { setOrderType('Dine In'); setIdempKey(null); }}>
                                    <span className="order-type-icon">🍽️</span><span>Dine In</span>
                                </button>
                                <button type="button" className={`order-type-btn${orderType === 'Take Out' ? ' active' : ''}`} onClick={() => { setOrderType('Take Out'); setIdempKey(null); }}>
                                    <span className="order-type-icon">🥡</span><span>Take Out</span>
                                </button>
                            </div>
                        </div>

                        <div className="pos-cart-items">
                            {cart.length === 0
                                ? <div className="cart-empty-state"><p>No items added yet</p></div>
                                : cart.map(item => (
                                    <div key={item.key} className="cart-item">
                                        <div className="cart-item-top">
                                            <div>
                                                <div className="cart-item-name">{item.item_name}</div>
                                                {item.drink_size && <span className="cart-drink-size">{item.drink_size}</span>}
                                            </div>
                                            <span className="cart-item-price">₱{item.price.toFixed(2)}</span>
                                        </div>
                                        <div className="cart-item-bottom">
                                            <div className="cart-quantity-controls">
                                                <button type="button" className="quantity-btn" onClick={() => changeQty(item.key, -1)}>−</button>
                                                <span className="cart-item-quantity">{item.quantity}</span>
                                                <button type="button" className="quantity-btn" onClick={() => changeQty(item.key, 1)}>+</button>
                                            </div>
                                            <strong className="cart-item-subtotal">₱{(item.price * item.quantity).toFixed(2)}</strong>
                                            <button type="button" className="remove-cart-item" onClick={() => removeItem(item.key)}>Remove</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="pos-cart-summary">
                            <div className="summary-row"><span>Subtotal</span><span>₱{total.toFixed(2)}</span></div>
                            <div className="summary-row total-row"><span>Total</span><span>₱{total.toFixed(2)}</span></div>
                        </div>

                        <button type="button" className="checkout-btn" disabled={checkoutDisabled} onClick={openCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                </section>
            </main>

            {/* CHECKOUT MODAL */}
            {checkoutOpen && (
                <div className="checkout-modal active" onClick={() => { if (!processing) setCheckoutOpen(false); }}>
                    <div className="checkout-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="checkout-modal-header">
                            <h2>Checkout</h2>
                            <button type="button" onClick={() => { if (!processing) setCheckoutOpen(false); }}>&times;</button>
                        </div>
                        <div className="checkout-details">
                            <div className="checkout-total-row">
                                <span>Total Amount</span>
                                <strong>₱{total.toFixed(2)}</strong>
                            </div>
                            <div className="checkout-form-group">
                                <label htmlFor="cashReceived">Cash Received</label>
                                <input
                                    id="cashReceived"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={cashReceived}
                                    onChange={e => setCashReceived(e.target.value)}
                                />
                            </div>
                            <div className="checkout-total-row">
                                <span>Change</span>
                                <strong>₱{change.toFixed(2)}</strong>
                            </div>
                        </div>
                        <div className="checkout-modal-actions">
                            <button type="button" id="cancelCheckout" onClick={() => { if (!processing) setCheckoutOpen(false); }}>Cancel</button>
                            <button type="button" id="confirmCheckout" onClick={confirmOrder} disabled={processing}>
                                {processing ? 'Processing Order...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INSUFFICIENT CASH MODAL */}
            {cashAlert && (
                <div className="cash-alert-overlay show" onClick={() => setCashAlert(false)}>
                    <div className="cash-alert-box" onClick={e => e.stopPropagation()}>
                        <div className="cash-alert-icon">₱</div>
                        <h2>Insufficient Cash</h2>
                        <p>The cash received is not enough to complete this transaction.</p>
                        <div className="cash-alert-note">Please enter an amount equal to or greater than the total amount.</div>
                        <button type="button" className="cash-alert-button" onClick={() => setCashAlert(false)}>Okay, Got It</button>
                    </div>
                </div>
            )}

            {/* ORDER ERROR MODAL */}
            {errorModal.open && (
                <div className="order-error-overlay active" onClick={() => setErrorModal({ open: false, msg: '' })}>
                    <div className="order-error-card" onClick={e => e.stopPropagation()}>
                        <button type="button" className="order-error-close" onClick={() => setErrorModal({ open: false, msg: '' })}>&times;</button>
                        <div className="order-error-icon">
                            <svg viewBox="0 0 48 48" fill="none">
                                <path d="M24 5.5 44 40H4L24 5.5Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
                                <path d="M24 17v11" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                                <circle cx="24" cy="34" r="1.8" fill="currentColor"/>
                            </svg>
                        </div>
                        <div className="order-error-brand">
                            <span className="order-error-brand-mark">K</span>
                            <span>Kape't Balay<small>Management System</small></span>
                        </div>
                        <span className="order-error-eyebrow">STOCK ALERT</span>
                        <h2>Unable to Complete Order</h2>
                        <p className="order-error-message">{errorModal.msg}</p>
                        <button type="button" className="order-error-okay" onClick={() => setErrorModal({ open: false, msg: '' })}>Okay, I Understand</button>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast.msg && <div className={`pos-toast show ${toast.type}`}>{toast.msg}</div>}
        </div>
    );
}
