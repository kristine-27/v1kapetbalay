import db from '../config/db.js';

// GET ALL STAFF
export const getAllStaff = async () => {
    const [rows] = await db.query(
        `SELECT staff_id, username, full_name, created_at
         FROM staff
         ORDER BY staff_id DESC`
    );

    return rows;
};

// FIND STAFF BY USERNAME
export const getStaffByUsername = async (username) => {
    const [rows] = await db.query(
        `SELECT staff_id, username, password, full_name
         FROM staff
         WHERE username = ?
         LIMIT 1`,
        [username]
    );

    return rows[0] || null;
};

// FIND STAFF BY ID
export const getStaffById = async (id) => {
    const [rows] = await db.query(
        `SELECT staff_id, username, full_name, created_at
         FROM staff
         WHERE staff_id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
};

// CREATE STAFF
export const createStaff = async (data) => {
    const { username, password, full_name } = data;

    const [result] = await db.query(
        `INSERT INTO staff (username, password, full_name)
         VALUES (?, ?, ?)`,
        [username, password, full_name]
    );

    return result.insertId;
};

// UPDATE STAFF
export const updateStaff = async (id, data) => {
    const { username, full_name } = data;

    const [result] = await db.query(
        `UPDATE staff
         SET username = ?, full_name = ?
         WHERE staff_id = ?`,
        [username, full_name, id]
    );

    return result.affectedRows;
};

// UPDATE STAFF PASSWORD
export const updateStaffPassword = async (id, password) => {
    const [result] = await db.query(
        `UPDATE staff
         SET password = ?
         WHERE staff_id = ?`,
        [password, id]
    );

    return result.affectedRows;
};

// DELETE STAFF
export const deleteStaff = async (id) => {
    const [result] = await db.query(
        `DELETE FROM staff
         WHERE staff_id = ?`,
        [id]
    );

    return result.affectedRows;
};