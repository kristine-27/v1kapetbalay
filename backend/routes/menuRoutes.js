
import express from 'express';

import {
    getMenuItems,
    getMenuItem,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
} from '../controllers/menuController.js';

const router = express.Router();

// READ ALL MENU ITEMS
router.get('/menu-items', getMenuItems);

// READ MENU ITEM BY ID
router.get('/menu-items/:id', getMenuItem);

// CREATE MENU ITEM
router.post('/menu-items', addMenuItem);

// UPDATE MENU ITEM
router.put('/menu-items/:id', updateMenuItem);

// DELETE MENU ITEM
router.delete('/menu-items/:id', deleteMenuItem);

export default router;
