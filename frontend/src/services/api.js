export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getToken() {
    return localStorage.getItem('auth_token') || '';
}

export function getStaff() {
    try {
        return JSON.parse(localStorage.getItem('staff') || 'null');
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('staff');
}

export async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401) {
        clearSession();
        window.location.href = '/?page=login';
        return null;
    }

    return res;
}

export async function apiJSON(path, options = {}) {
    const res = await apiFetch(path, options);
    if (!res) return null;
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.message || `Request failed (${res.status})`);
    return payload;
}

export async function logout() {
    try {
        await apiFetch('/api/logout', { method: 'POST' });
    } catch { /* ignore */ }
    clearSession();
}
