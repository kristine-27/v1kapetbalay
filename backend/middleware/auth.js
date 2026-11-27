import db from '../config/db.js';

/**
 * Simple token-based auth middleware.
 * The frontend stores the session token in localStorage and sends it
 * as:  Authorization: Bearer <token>
 *
 * The token is a random UUID created on login and stored in the
 * staff_sessions table with an expiry time.
 */
export const requireAuth = async (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT s.staff_id, s.username, s.full_name
             FROM staff_sessions ss
             JOIN staff s ON ss.staff_id = s.staff_id
             WHERE ss.token = ?
               AND ss.expires_at > NOW()
             LIMIT 1`,
            [token]
        );

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: 'Session expired or invalid. Please log in again.'
            });
        }

        req.staff = rows[0];
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication check failed.'
        });
    }
};
