import { useState } from 'react';
import { logout } from '../services/api.js';
import { IconCashier, IconDashboard, IconInventory, IconKitchen, IconLogout, IconMenu } from './Icons.jsx';
import './Sidebar.css';

const NAV_LINKS = [
    { page: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
    { page: 'menu',      label: 'Menu',      Icon: IconMenu },
    { page: 'inventory', label: 'Inventory', Icon: IconInventory },
    { page: 'cashier',   label: 'Cashier',   Icon: IconCashier },
    { page: 'kitchen',   label: 'Kitchen',   Icon: IconKitchen },
];

export default function Sidebar({ currentPage, onNavigate }) {
    const [showLogout, setShowLogout] = useState(false);

    function navigate(page) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.pushState({}, '', url);
        onNavigate(page);
    }

    async function handleLogout() {
        await logout();
        navigate('login');
    }

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>Kape't Balay</h2>
                    <p>Management</p>
                </div>

                <nav className="sidebar-menu">
                    {NAV_LINKS.map(({ page, label, Icon }) => (
                        <button
                            key={page}
                            type="button"
                            className={`sidebar-link${currentPage === page ? ' active' : ''}`}
                            onClick={() => navigate(page)}
                        >
                            <Icon />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <button
                        type="button"
                        className="logout-btn"
                        onClick={() => setShowLogout(true)}
                    >
                        <IconLogout /> Logout
                    </button>
                </div>
            </aside>

            {showLogout && (
                <div className="logout-overlay" onClick={() => setShowLogout(false)}>
                    <div className="logout-modal" onClick={e => e.stopPropagation()}>
                        <div className="logout-icon-wrap">
                            <IconLogout />
                        </div>
                        <h2>Logout Confirmation</h2>
                        <p>Are you sure you want to logout?</p>
                        <div className="logout-actions">
                            <button
                                type="button"
                                className="logout-cancel"
                                onClick={() => setShowLogout(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="logout-confirm"
                                onClick={handleLogout}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
