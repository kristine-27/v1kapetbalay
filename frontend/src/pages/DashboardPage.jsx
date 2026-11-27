import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiJSON } from '../services/api.js';
import './Dashboard.css';

export default function DashboardPage({ onNavigate }) {
    const [orders, setOrders]       = useState([]);
    const [inventory, setInventory] = useState([]);
    const [sales, setSales]         = useState({ today_sales: 0, completed_orders: 0 });

    const load = useCallback(async () => {
        try {
            const [ordersRes, inventoryRes, salesRes] = await Promise.all([
                apiJSON('/api/orders'),
                apiJSON('/api/inventory'),
                apiJSON('/api/orders/today-sales'),
            ]);
            setOrders(ordersRes?.data || []);
            setInventory(inventoryRes?.data || []);
            setSales(salesRes?.data || { today_sales: 0, completed_orders: 0 });
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, 5000);
        return () => clearInterval(id);
    }, [load]);

    const today = new Date().toLocaleDateString();

    const todaysOrders = orders.filter(o =>
        o.order_date && new Date(o.order_date).toLocaleDateString() === today
    );

    const lowStockItems = inventory.filter(item =>
        Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.minimum_stock ?? 0)
    );

    const outOfStockItems = inventory.filter(item => Number(item.quantity) <= 0);

    const recentOrders = [...todaysOrders]
        .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
        .slice(0, 5);

    function formatOrderWhen(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    return (
        <div className="page-layout">
            <Sidebar currentPage="dashboard" onNavigate={onNavigate} />

            <main className="main-content">
                <header className="topbar">
                    <div className="page-title">
                        <h1>Admin Dashboard</h1>
                        <p>Welcome to Kape't Balay Management System</p>
                    </div>
                    <div className="admin-profile">
                        <div className="admin-info">
                            <h4>Where every sip</h4>
                            <p>feels like home.</p>
                        </div>
                    </div>
                </header>

                {/* CARDS */}
                <section className="dashboard-cards">
                    <div className="dashboard-card">
                        <p className="card-label">Today's Sales</p>
                        <h2 className="card-value">₱{Number(sales.today_sales).toFixed(2)}</h2>
                        <p className="card-description">Total sales for today</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Total Orders</p>
                        <h2 className="card-value">{todaysOrders.length}</h2>
                        <p className="card-description">Orders recorded today</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Low Stock Items</p>
                        <h2 className="card-value">{lowStockItems.length}</h2>
                        <p className="card-description">Items needing restock</p>
                    </div>
                    <div className="dashboard-card">
                        <p className="card-label">Out of Stock</p>
                        <h2 className="card-value">{outOfStockItems.length}</h2>
                        <p className="card-description">Items with zero quantity</p>
                    </div>
                </section>

                {/* RECENT ORDERS */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <div>
                            <h2>Recent Orders</h2>
                            <p>Overview of the latest customer orders</p>
                        </div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date & Time</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="empty-state">No orders recorded yet.</div>
                                        </td>
                                    </tr>
                                ) : recentOrders.map(order => (
                                    <tr key={order.order_id}>
                                        <td>#{order.daily_order_number ?? order.order_id}</td>
                                        <td>{formatOrderWhen(order.order_date)}</td>
                                        <td>{(order.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ') || 'No items'}</td>
                                        <td>₱{Number(order.total_amount || 0).toFixed(2)}</td>
                                        <td>{order.status || 'Pending'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* INVENTORY OVERVIEW */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <div>
                            <h2>Inventory Overview</h2>
                            <p>Current inventory status</p>
                        </div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.length === 0 ? (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="empty-state">No inventory items recorded yet.</div>
                                        </td>
                                    </tr>
                                ) : inventory.slice(0, 10).map(item => {
                                    const qty = Number(item.quantity ?? 0);
                                    const min = Number(item.minimum_stock ?? 0);
                                    const status = qty <= 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock';
                                    return (
                                        <tr key={item.item_id}>
                                            <td>{item.item_name}</td>
                                            <td>{item.category}</td>
                                            <td>{qty}</td>
                                            <td>{status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
