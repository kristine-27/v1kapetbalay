
import express from 'express';

import {
    getOrders,
    getTodaySales,
    getOrder,
    createOrder,
    updateOrderStatus,
    deleteOrder
} from '../controllers/orderController.js';

const router = express.Router();

// GET ALL ORDERS
router.get('/orders', getOrders);

// GET TODAY'S COMPLETED SALES
router.get('/orders/today-sales', getTodaySales);

// GET ORDER BY ID
router.get('/orders/:id', getOrder);

// CREATE ORDER
router.post('/orders', createOrder);

// UPDATE ORDER STATUS
router.patch('/orders/:id/status', updateOrderStatus);

// DELETE ORDER
router.delete('/orders/:id', deleteOrder);

export default router;
