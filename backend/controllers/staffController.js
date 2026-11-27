import * as staffService from '../services/staffService.js';

// STAFF LOGIN
export const loginStaff = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await staffService.loginStaff(username, password);

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            staff: {
                staff_id: result.staff_id,
                username: result.username,
                full_name: result.full_name
            },
            token: result.token
        });

    } catch (error) {
        console.error('Login error:', error);

        const statusCode =
            error.message === 'Invalid username or password.' ||
            error.message === 'Please enter your username and password.'
                ? 401
                : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Something went wrong during login.'
        });
    }
};

// STAFF LOGOUT
export const logoutStaff = async (req, res) => {
    try {
        const header = req.headers['authorization'] || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;

        await staffService.logoutStaff(token);

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed.'
        });
    }
};

// GET ALL STAFF
export const getStaff = async (req, res) => {
    try {
        const staff = await staffService.getStaffList();
        return res.status(200).json({ success: true, data: staff });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
    }
};

// GET STAFF BY ID
export const getStaffMember = async (req, res) => {
    try {
        const staff = await staffService.getStaffDetails(req.params.id);
        return res.status(200).json({ success: true, data: staff });
    } catch (error) {
        const statusCode = error.message === 'Staff member not found.' ? 404 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

// CREATE STAFF
export const addStaff = async (req, res) => {
    try {
        const staffId = await staffService.addStaff(req.body);
        return res.status(201).json({
            success: true,
            message: 'Staff member created successfully.',
            staff_id: staffId
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// UPDATE STAFF
export const updateStaff = async (req, res) => {
    try {
        await staffService.editStaff(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Staff member updated successfully.'
        });
    } catch (error) {
        const statusCode = error.message === 'Staff member not found.' ? 404 : 400;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
    try {
        const { new_password } = req.body || {};
        await staffService.changeStaffPassword(req.params.id, new_password);
        return res.status(200).json({
            success: true,
            message: 'Password changed successfully.'
        });
    } catch (error) {
        const statusCode = error.message === 'Staff member not found.' ? 404 : 400;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

// DELETE STAFF
export const deleteStaff = async (req, res) => {
    try {
        await staffService.removeStaff(req.params.id);
        return res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully.'
        });
    } catch (error) {
        const statusCode = error.message === 'Staff member not found.' ? 404 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};
