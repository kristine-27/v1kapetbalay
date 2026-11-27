
import * as menuModel from '../models/menuModel.js';

// GET ALL MENU ITEMS
export const getMenuList = async () => {
    return await menuModel.getAllMenuItems();
};

// GET MENU ITEM BY ID
export const getMenuDetails = async (id) => {
    const item = await menuModel.getMenuItemById(id);

    if (!item) {
        throw new Error('Menu item not found.');
    }

    return item;
};

// CREATE MENU ITEM
export const addMenuItem = async (data) => {
    const {
        item_name,
        category,
        price,
        availability
    } = data;

    if (
        !item_name?.trim() ||
        !category?.trim() ||
        price === undefined ||
        price === ''
    ) {
        throw new Error('Please complete all required menu fields.');
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        throw new Error('Menu price must be a valid non-negative number.');
    }

    const menuAvailability = availability || 'Available';

    if (!['Available', 'Unavailable'].includes(menuAvailability)) {
        throw new Error('Invalid menu availability.');
    }

    return await menuModel.createMenuItem({
        item_name: item_name.trim(),
        category: category.trim(),
        price: Number(price),
        availability: menuAvailability
    });
};

// UPDATE MENU ITEM
export const editMenuItem = async (id, data) => {
    const existingItem = await menuModel.getMenuItemById(id);

    if (!existingItem) {
        throw new Error('Menu item not found.');
    }

    const {
        item_name,
        category,
        price,
        availability
    } = data;

    if (
        !item_name?.trim() ||
        !category?.trim() ||
        price === undefined ||
        price === ''
    ) {
        throw new Error('Please complete all required menu fields.');
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        throw new Error('Menu price must be a valid non-negative number.');
    }

    if (!['Available', 'Unavailable'].includes(availability)) {
        throw new Error('Invalid menu availability.');
    }

    return await menuModel.updateMenuItem(id, {
        item_name: item_name.trim(),
        category: category.trim(),
        price: Number(price),
        availability
    });
};

// DELETE MENU ITEM
export const removeMenuItem = async (id) => {
    const existingItem = await menuModel.getMenuItemById(id);

    if (!existingItem) {
        throw new Error('Menu item not found.');
    }

    return await menuModel.deleteMenuItem(id);
};
