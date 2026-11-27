
import * as menuService from '../services/menuService.js';

// GET ALL MENU ITEMS
export const getMenuItems = async (req, res) => {
    try {
        const items = await menuService.getMenuList();

        return res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch menu items'
        });
    }
};

// GET MENU ITEM BY ID
export const getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await menuService.getMenuDetails(id);

        return res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        const statusCode = error.message === 'Menu item not found.' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// ADD MENU ITEM
export const addMenuItem = async (req, res) => {
    try {
        const itemId = await menuService.addMenuItem(req.body);

        return res.status(201).json({
            success: true,
            message: 'Menu item added successfully.',
            menu_id: itemId
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE MENU ITEM
export const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        await menuService.editMenuItem(id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Menu item updated successfully.'
        });
    } catch (error) {
        const statusCode = error.message === 'Menu item not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE MENU ITEM
export const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        await menuService.removeMenuItem(id);

        return res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully.'
        });
    } catch (error) {
        const statusCode = error.message === 'Menu item not found.' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};
