import express from 'express';
import cors from 'cors';
import db from './config/db.js';
import { requireAuth } from './middleware/auth.js';

import loginRoutes from './routes/login.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import staffRoutes from './routes/staffRoutes.js';

const app = express();
const PORT = 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// PUBLIC ROUTES (no auth required)
app.use('/api', loginRoutes);

// PROTECTED ROUTES
app.use('/api', requireAuth, inventoryRoutes);
app.use('/api', requireAuth, menuRoutes);
app.use('/api', requireAuth, orderRoutes);
app.use('/api', requireAuth, staffRoutes);

// MAIN ROUTE
app.get('/', (req, res) => {
    res.send("Kape't Balay Management System API is running!");
});

// DATABASE TEST
app.get('/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1 AS test');

        res.status(200).json({
            success: true,
            message: 'Database connection successful!',
            result
        });

    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            success: false,
            message: 'Database connection failed.',
            error: error.message
        });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`listening to port ${PORT}...`);
});
