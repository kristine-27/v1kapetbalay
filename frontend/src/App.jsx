import { useEffect, useState } from 'react';
import { getToken } from './services/api.js';
import LoginPage     from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MenuPage      from './pages/MenuPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CashierPage   from './pages/CashierPage.jsx';
import KitchenPage   from './pages/KitchenPage.jsx';
import './style.css';

const PROTECTED = ['dashboard', 'menu', 'inventory', 'cashier', 'kitchen'];

function getPage() {
    const p = new URLSearchParams(window.location.search).get('page');
    return PROTECTED.includes(p) || p === 'login' ? p : 'login';
}

function navigate(page) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
}

export default function App() {
    const [page, setPage] = useState(() => {
        const p = getPage();
        if (PROTECTED.includes(p) && !getToken()) return 'login';
        if (p === 'login' && getToken()) return 'dashboard';
        return p || 'login';
    });

    useEffect(() => {
        const handler = () => {
            const p = getPage();
            if (PROTECTED.includes(p) && !getToken()) { setPage('login'); navigate('login'); return; }
            setPage(p);
        };
        window.addEventListener('popstate', handler);
        return () => window.removeEventListener('popstate', handler);
    }, []);

    function goTo(p) {
        navigate(p);
        setPage(p);
    }

    function handleLogin() { goTo('dashboard'); }

    if (page === 'login')     return <LoginPage onLogin={handleLogin} />;
    if (!getToken())          { navigate('login'); return <LoginPage onLogin={handleLogin} />; }
    if (page === 'menu')      return <MenuPage      onNavigate={goTo} />;
    if (page === 'inventory') return <InventoryPage onNavigate={goTo} />;
    if (page === 'cashier')   return <CashierPage   onNavigate={goTo} />;
    if (page === 'kitchen')   return <KitchenPage   onNavigate={goTo} />;
    return <DashboardPage onNavigate={goTo} />;
}
