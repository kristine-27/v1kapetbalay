
import * as inventoryModel from '../models/inventoryModel.js';
import db from '../config/db.js';

// GET ALL INVENTORY
export const getInventoryList = async () => {
    return await inventoryModel.getAllInventory();
};

// GET INVENTORY BY ID
export const getInventoryDetails = async (id) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    return item;
};

// CREATE INVENTORY
export const addInventoryItem = async (data) => {
    const {
        item_name,
        category,
        quantity,
        unit,
        minimum_stock
    } = data;

    if (
        !item_name?.trim() ||
        !category?.trim() ||
        quantity === undefined ||
        quantity === '' ||
        !unit?.trim() ||
        minimum_stock === undefined ||
        minimum_stock === ''
    ) {
        throw new Error('Please complete all inventory fields.');
    }

    if (
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) < 0 ||
        !Number.isFinite(Number(minimum_stock)) ||
        Number(minimum_stock) < 0
    ) {
        throw new Error('Quantity and minimum stock must be valid non-negative numbers.');
    }

    return await inventoryModel.createInventory({
        item_name: item_name.trim(),
        category: category.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        minimum_stock: Number(minimum_stock)
    });
};

// UPDATE INVENTORY
export const editInventoryItem = async (id, data) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    const {
        item_name,
        category,
        quantity,
        unit,
        minimum_stock
    } = data;

    if (
        !item_name?.trim() ||
        !category?.trim() ||
        quantity === undefined ||
        quantity === '' ||
        !unit?.trim() ||
        minimum_stock === undefined ||
        minimum_stock === ''
    ) {
        throw new Error('Please complete all inventory fields.');
    }

    if (
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) < 0 ||
        !Number.isFinite(Number(minimum_stock)) ||
        Number(minimum_stock) < 0
    ) {
        throw new Error('Quantity and minimum stock must be valid non-negative numbers.');
    }

    return await inventoryModel.updateInventory(id, {
        item_name: item_name.trim(),
        category: category.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        minimum_stock: Number(minimum_stock)
    });
};

// DELETE INVENTORY
export const removeInventoryItem = async (id) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    return await inventoryModel.deleteInventory(id);
};

// STOCK-IN: add quantity and log to stock_movements
export const stockIn = async (id, quantityReceived, remarks) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    const received = Number(quantityReceived);

    if (!Number.isFinite(received) || received <= 0) {
        throw new Error('Quantity received must be a positive number.');
    }

    const newQuantity = Number(
        (Number(item.quantity) + received).toFixed(2)
    );

    await inventoryModel.updateInventory(id, {
        item_name: item.item_name,
        category: item.category,
        quantity: newQuantity,
        unit: item.unit,
        minimum_stock: item.minimum_stock
    });

    await db.query(
        `INSERT INTO stock_movements
            (item_id, movement_type, quantity, remarks, movement_date)
         VALUES (?, 'Stock In', ?, ?, NOW())`,
        [id, received, remarks || null]
    );

    return { new_quantity: newQuantity };
};

// STOCK USAGE: deduct quantity and log to stock_movements
export const stockUsage = async (id, quantityUsed, remarks) => {
    const item = await inventoryModel.getInventoryById(id);

    if (!item) {
        throw new Error('Inventory item not found.');
    }

    const used = Number(quantityUsed);

    if (!Number.isFinite(used) || used <= 0) {
        throw new Error('Quantity used must be a positive number.');
    }

    if (used > Number(item.quantity)) {
        throw new Error(
            `Insufficient stock. Available: ${item.quantity} ${item.unit}.`
        );
    }

    const newQuantity = Number(
        (Number(item.quantity) - used).toFixed(2)
    );

    await inventoryModel.updateInventory(id, {
        item_name: item.item_name,
        category: item.category,
        quantity: newQuantity,
        unit: item.unit,
        minimum_stock: item.minimum_stock
    });

    await db.query(
        `INSERT INTO stock_movements
            (item_id, movement_type, quantity, remarks, movement_date)
         VALUES (?, 'Stock Usage', ?, ?, NOW())`,
        [id, used, remarks || null]
    );

    return { new_quantity: newQuantity };
};
/// bug fixes update