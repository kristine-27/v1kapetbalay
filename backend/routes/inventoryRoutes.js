
import express from 'express';

import {
    getInventory,
    addInventory,
    updateInventory,
    deleteInventory,
    recordStockIn,
    recordStockUsage
} from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/inventory', getInventory);
router.post('/inventory', addInventory);
router.put('/inventory/:id', updateInventory);
router.delete('/inventory/:id', deleteInventory);

// STOCK MOVEMENTS
router.post('/inventory/:id/stock-in', recordStockIn);
router.post('/inventory/:id/stock-usage', recordStockUsage);

export default router;
