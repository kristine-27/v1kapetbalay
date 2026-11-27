
import * as inventoryService from '../services/inventoryService.js';

// GET ALL INVENTORY
export const getInventory = async (req, res) => {
    try {
        const items = await inventoryService.getInventoryList();

        return res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Fetch inventory error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory items'
        });
    }
};

// ADD INVENTORY ITEM
export const addInventory = async (req, res) => {
    try {
        const itemId = await inventoryService.addInventoryItem(req.body);

        return res.status(201).json({
            success: true,
            message: 'Inventory item added successfully',
            item_id: itemId
        });
    } catch (error) {
        console.error('Add inventory error:', error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE INVENTORY ITEM
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;

        await inventoryService.editInventoryItem(id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully'
        });
    } catch (error) {
        console.error('Update inventory error:', error);

        const statusCode = error.message === 'Inventory item not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE INVENTORY ITEM
export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;

        await inventoryService.removeInventoryItem(id);

        return res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Delete inventory error:', error);

        const statusCode = error.message === 'Inventory item not found.' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// STOCK-IN
export const recordStockIn = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity_received, remarks } = req.body || {};

        const result = await inventoryService.stockIn(id, quantity_received, remarks);

        return res.status(200).json({
            success: true,
            message: 'Stock-in recorded successfully.',
            data: result
        });
    } catch (error) {
        console.error('Stock-in error:', error);

        const statusCode = error.message === 'Inventory item not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// STOCK USAGE
export const recordStockUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity_used, remarks } = req.body || {};

        const result = await inventoryService.stockUsage(id, quantity_used, remarks);

        return res.status(200).json({
            success: true,
            message: 'Stock usage recorded successfully.',
            data: result
        });
    } catch (error) {
        console.error('Stock usage error:', error);

        const statusCode = error.message === 'Inventory item not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};
