import express from 'express';
import { loginStaff, logoutStaff } from '../controllers/staffController.js';

const router = express.Router();

// STAFF LOGIN
router.post('/login', loginStaff);

// STAFF LOGOUT
router.post('/logout', logoutStaff);

export default router;
