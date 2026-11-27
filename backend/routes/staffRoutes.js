import express from 'express';
import {
    getStaff,
    getStaffMember,
    addStaff,
    updateStaff,
    changePassword,
    deleteStaff
} from '../controllers/staffController.js';

const router = express.Router();

router.get('/staff', getStaff);
router.get('/staff/:id', getStaffMember);
router.post('/staff', addStaff);
router.put('/staff/:id', updateStaff);
router.patch('/staff/:id/password', changePassword);
router.delete('/staff/:id', deleteStaff);

export default router;
