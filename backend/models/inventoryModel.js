
import db from '../config/db.js';

// GET ALL INVENTORY
export const getAllInventory = async () => {
    const [items] = await db.query(
        'SELECT * FROM inventory ORDER BY item_name ASC'
    );

    return items;
};

// GET INVENTORY BY ID
export const getInventoryById = async (id) => {
    const [items] = await db.query(
        'SELECT * FROM inventory WHERE item_id = ?',
        [id]
    );

    return items[0] || null;
};

// CREATE INVENTORY
export const createInventory = async (data) => {
    const {
        item_name,
        category,
        quantity,
        unit,
        minimum_stock
    } = data;

    const [result] = await db.query(
        `INSERT INTO inventory
        (item_name, category, quantity, unit, minimum_stock)
        VALUES (?, ?, ?, ?, ?)`,
        [item_name, category, quantity, unit, minimum_stock]
    );

    return result.insertId;
};

// UPDATE INVENTORY
export const updateInventory = async (id, data) => {
    const {
        item_name,
        category,
        quantity,
        unit,
        minimum_stock
    } = data;

    const [result] = await db.query(
        `UPDATE inventory
         SET item_name = ?,
             category = ?,
             quantity = ?,
             unit = ?,
             minimum_stock = ?
         WHERE item_id = ?`,
        [item_name, category, quantity, unit, minimum_stock, id]
    );

    return result.affectedRows;
};

// DELETE INVENTORY
export const deleteInventory = async (id) => {
    const [result] = await db.query(
        'DELETE FROM inventory WHERE item_id = ?',
        [id]
    );

    return result.affectedRows;
};
