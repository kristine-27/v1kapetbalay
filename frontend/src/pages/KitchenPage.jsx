import { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../services/api.js';
import './Kitchen.css';

const COLUMN_CONFIG = [
    { status: 'Pending',   label: 'Pending',   emptyMsg: 'No pending orders',        action: 'Start preparing' },
    { status: 'Preparing', label: 'Preparing', emptyMsg: 'Nothing being prepared',   action: 'Mark ready' },
    { status: 'Ready',     label: 'Ready',     emptyMsg: 'Nothing ready',            action: 'Complete' },
    { status: 'Completed', label: 'Completed', emptyMsg: 'No completed orders',      action: 'Remove' },
];

const NEXT_STATUS = {
    Pending: 'Preparing',
    Preparing: 'Ready',
    Ready: 'Completed',
};

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getRemovedIds() {
    try { const s = JSON.parse(localStorage.getItem('removedCompletedOrders') || '[]'); return new Set(Array.isArray(s) ? s.map(Number) : []); }
    catch { return new Set(); }
}

function saveRemovedIds(set) {
    localStorage.setItem('removedCompletedOrders', JSON.stringify([...set]));
}

function sortOldest(list) {
    return [...list].sort((a, b) => {
        const diff = new Date(a.order_date) - new Date(b.order_date);
        return diff !== 0 ? diff : Number(a.daily_order_number ?? a.order_id) - Number(b.daily_order_number ?? b.order_id);
    });
}

function OrderCard({ order, actionLabel, onAction }) {
    const displayNum = order.daily_order_number ?? order.order_id;
    const time = formatTime(order.order_date);
    const items = Array.isArray(order.items) ? order.items : [];

    return (
        <article className="kitchen-ticket">
            <header className="kitchen-ticket-top">
                <h3>#{displayNum}</h3>
                <p>
                    {[time, order.order_type].filter(Boolean).join(' · ')}
                </p>
            </header>

            <ul className="kitchen-ticket-items">
                {items.length > 0
                    ? items.map((item, i) => (
                        <li key={i}>
                            <span className="kitchen-qty">{item.quantity}</span>
                            <span className="kitchen-item-name">{item.item_name}</span>
                            {item.drink_size && <span className="kitchen-size">{item.drink_size}</span>}
                        </li>
                    ))
                    : <li className="kitchen-ticket-empty">No items</li>
                }
            </ul>

            <button
                type="button"
                className={`kitchen-action${order.status === 'Completed' ? ' quiet' : ''}`}
                onClick={onAction}
            >
                {actionLabel}
            </button>
        </article>
    );
}

export default function KitchenPage({ onNavigate }) {
    const [orders, setOrders]           = useState([]);
    const [removedIds, setRemovedIds]   = useState(getRemovedIds);
    const loadingRef                    = useRef(false);

    const loadOrders = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        try {
            const res = await apiFetch('/api/orders');
            if (!res) return;
            const result = await res.json();
            if (result.success) setOrders(result.data || []);
        } catch (err) {
            console.error('Kitchen load error:', err);
        } finally {
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        loadOrders();
        const id = setInterval(loadOrders, 5000);
        return () => clearInterval(id);
    }, [loadOrders]);

    async function updateStatus(orderId, newStatus) {
        try {
            const res = await apiFetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res) return;
            const result = await res.json();
            if (!result.success) throw new Error(result.message);
            await loadOrders();
        } catch (err) {
            alert(err.message || 'Failed to update order status.');
        }
    }

    function removeCompleted(orderId) {
        const updated = new Set(removedIds);
        updated.add(Number(orderId));
        setRemovedIds(updated);
        saveRemovedIds(updated);
    }

    const sorted = sortOldest(orders);

    const grouped = {
        Pending:   sorted.filter(o => o.status === 'Pending'),
        Preparing: sorted.filter(o => o.status === 'Preparing'),
        Ready:     sorted.filter(o => o.status === 'Ready'),
        Completed: sorted.filter(o => o.status === 'Completed' && !removedIds.has(Number(o.order_id))),
    };

    return (
        <div className="kitchen-layout">
            <Sidebar currentPage="kitchen" onNavigate={onNavigate} />

            <main className="kitchen-main">
                <header className="kitchen-header">
                    <div>
                        <h1>Kitchen</h1>
                        <p>Oldest orders first. Move each ticket to the next step.</p>
                    </div>
                </header>

                <section className="kitchen-board">
                    {COLUMN_CONFIG.map(({ status, label, emptyMsg, action }) => (
                        <div key={status} className="order-column">
                            <div className="column-header">
                                <h2>{label}</h2>
                                <span>{grouped[status].length}</span>
                            </div>
                            <div className="order-list">
                                {grouped[status].length === 0
                                    ? <p className="empty-orders">{emptyMsg}</p>
                                    : grouped[status].map(order => (
                                        <OrderCard
                                            key={order.order_id}
                                            order={order}
                                            actionLabel={action}
                                            onAction={() => (
                                                status === 'Completed'
                                                    ? removeCompleted(order.order_id)
                                                    : updateStatus(order.order_id, NEXT_STATUS[status])
                                            )}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
