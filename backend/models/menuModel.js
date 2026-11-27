
import db from '../config/db.js';

// GET ALL MENU ITEMS
export const getAllMenuItems = async () => {
    const [rows] = await db.query(`
        SELECT menu_id, item_name, category, price, availability
        FROM menu_items
        ORDER BY category, item_name
    `);

    return rows;
};

// GET MENU ITEM BY ID
export const getMenuItemById = async (id) => {
    const [rows] = await db.query(
        `SELECT menu_id, item_name, category, price, availability
         FROM menu_items
         WHERE menu_id = ?`,
        [id]
    );

    return rows[0] || null;
};

// CREATE MENU ITEM
export const createMenuItem = async (data) => {
    const {
        item_name,
        category,
        price,
        availability
    } = data;

    const [result] = await db.query(
        `INSERT INTO menu_items
        (item_name, category, price, availability)
        VALUES (?, ?, ?, ?)`,
        [item_name, category, price, availability]
    );

    return result.insertId;
};

// UPDATE MENU ITEM
export const updateMenuItem = async (id, data) => {
    const {
        item_name,
        category,
        price,
        availability
    } = data;

    const [result] = await db.query(
        `UPDATE menu_items
         SET item_name = ?,
             category = ?,
             price = ?,
             availability = ?
         WHERE menu_id = ?`,
        [item_name, category, price, availability, id]
    );

    return result.affectedRows;
};

// DELETE MENU ITEM
export const deleteMenuItem = async (id) => {
    const [result] = await db.query(
        'DELETE FROM menu_items WHERE menu_id = ?',
        [id]
    );

    return result.affectedRows;
};
