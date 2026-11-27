import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as staffModel from '../models/staffModel.js';
import db from '../config/db.js';

const SESSION_HOURS = 8;
const SALT_ROUNDS = 10;

// STAFF LOGIN — returns staff info + session token
export const loginStaff = async (username, password) => {
    if (!username || !password) {
        throw new Error('Please enter your username and password.');
    }

    const staff = await staffModel.getStaffByUsername(username);

    if (!staff) {
        throw new Error('Invalid username or password.');
    }

    const passwordMatch = await bcrypt.compare(password, staff.password);

    if (!passwordMatch) {
        throw new Error('Invalid username or password.');
    }

    const token = randomUUID();
    const expiresAt = new Date(
        Date.now() + SESSION_HOURS * 60 * 60 * 1000
    );

    await db.query(
        `INSERT INTO staff_sessions (staff_id, token, expires_at)
         VALUES (?, ?, ?)`,
        [staff.staff_id, token, expiresAt]
    );

    return {
        staff_id: staff.staff_id,
        username: staff.username,
        full_name: staff.full_name,
        token
    };
};

// STAFF LOGOUT — delete the session token
export const logoutStaff = async (token) => {
    if (!token) return;
    await db.query(
        'DELETE FROM staff_sessions WHERE token = ?',
        [token]
    );
};

// GET ALL STAFF
export const getStaffList = async () => {
    return await staffModel.getAllStaff();
};

// GET STAFF BY ID
export const getStaffDetails = async (id) => {
    const staff = await staffModel.getStaffById(id);
    if (!staff) throw new Error('Staff member not found.');
    return staff;
};

// CREATE STAFF
export const addStaff = async (data) => {
    const { username, password, full_name } = data;

    if (!username?.trim() || !password || !full_name?.trim()) {
        throw new Error('Please complete all staff fields.');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
    }

    const existing = await staffModel.getStaffByUsername(username.trim());
    if (existing) {
        throw new Error('Username already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    return await staffModel.createStaff({
        username: username.trim(),
        password: hashedPassword,
        full_name: full_name.trim()
    });
};

// UPDATE STAFF (name and username only — no password)
export const editStaff = async (id, data) => {
    const staff = await staffModel.getStaffById(id);
    if (!staff) throw new Error('Staff member not found.');

    const { username, full_name } = data;

    if (!username?.trim() || !full_name?.trim()) {
        throw new Error('Please complete all staff fields.');
    }

    const existing = await staffModel.getStaffByUsername(username.trim());
    if (existing && Number(existing.staff_id) !== Number(id)) {
        throw new Error('Username already exists.');
    }

    return await staffModel.updateStaff(id, {
        username: username.trim(),
        full_name: full_name.trim()
    });
};

// CHANGE STAFF PASSWORD
export const changeStaffPassword = async (id, newPassword) => {
    const staff = await staffModel.getStaffById(id);
    if (!staff) throw new Error('Staff member not found.');

    if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    return await staffModel.updateStaffPassword(id, hashedPassword);
};

// DELETE STAFF
export const removeStaff = async (id) => {
    const staff = await staffModel.getStaffById(id);
    if (!staff) throw new Error('Staff member not found.');
    return await staffModel.deleteStaff(id);
};
