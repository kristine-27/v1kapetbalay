import { useState } from 'react';
import { API_BASE } from '../services/api.js';
import './Login.css';

export default function LoginPage({ onLogin }) {
    const [username, setUsername]       = useState('');
    const [password, setPassword]       = useState('');
    const [showPass, setShowPass]       = useState(false);
    const [message, setMessage]         = useState({ text: '', type: '' });
    const [loading, setLoading]         = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Login failed.');

            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('staff', JSON.stringify(data.staff));

            setMessage({ text: 'Login successful!', type: 'success' });

            setTimeout(() => onLogin(), 400);
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <div className="login-brand">
                    <img src="/images/logo.jpg" alt="" />
                    <div>
                        <h1>Kape't Balay</h1>
                        <p>Management</p>
                    </div>
                </div>

                <h2>Sign in</h2>
                <p className="subtitle">Use your staff account to continue.</p>

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-wrapper">
                        <input
                            id="password"
                            type={showPass ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(v => !v)}
                        >
                            {showPass ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {message.text && (
                    <p className={`login-message ${message.type}`}>
                        {message.text}
                    </p>
                )}

                <button
                    type="submit"
                    className="login-btn"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </div>
    );
}
