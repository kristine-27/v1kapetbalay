import db from '../config/db.js';
import * as orderModel from '../models/orderModel.js';

const DRINK_CATEGORIES = new Set(['coffee', 'non-coffee']);
const VALID_ORDER_TYPES = new Set(['Dine In', 'Take Out']);
const VALID_DRINK_SIZES = new Set(['22oz', '24oz']);

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const isDrinkCategory = (category) =>
    DRINK_CATEGORIES.has(normalizeName(category));

const getSuppliesForItem = (category, orderType) => {
    const normalizedCategory = normalizeName(category);
    const isDrink = DRINK_CATEGORIES.has(normalizedCategory);
    const isFoodOrPastry = ['food', 'pastry'].includes(normalizedCategory);

    if (isDrink) {
        return orderType === 'Take Out'
            ? ['Cup', 'Cup Dome', 'Straw', 'Tissue', 'Paper Bag']
            : ['Cup', 'Cup Dome', 'Straw', 'Tissue'];
    }

    if (isFoodOrPastry) {
        return orderType === 'Take Out'
            ? ['Food Box', 'Tissue', 'Spoon', 'Fork', 'Paper Bag']
            : ['Spoon', 'Fork', 'Tissue'];
    }

    throw new Error(
        `Unsupported menu category "${category}". Inventory was not changed.`
    );
};

export const getOrderList = async () => orderModel.getAllOrders();

export const getTodaySalesSummary = async () => orderModel.getTodaySales();

export const getOrderDetails = async (id) => {
    const order = await orderModel.getOrderById(id);
    if (!order) throw new Error('Order not found.');
    return order;
};

export const addOrder = async (items, orderType, idempotencyKey) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Order must contain at least one item.');
    }

    if (!VALID_ORDER_TYPES.has(orderType)) {
        throw new Error('Please select a valid order type: Dine In or Take Out.');
    }

    if (
        typeof idempotencyKey !== 'string' ||
        idempotencyKey.length < 8 ||
        idempotencyKey.length > 64
    ) {
        throw new Error('Invalid checkout request key. Please try checkout again.');
    }

    // If the browser retries the same request, return the original order.
    const existingOrder = await orderModel.getOrderByIdempotencyKey(idempotencyKey);
    if (existingOrder) return existingOrder;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let totalAmount = 0;
        const validatedItems = [];
        const requiredSupplies = new Map();

        for (const item of items) {
            const menuId = Number(item.menu_id);
            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(menuId) || menuId <= 0 ||
                !Number.isInteger(quantity) || quantity <= 0
            ) {
                throw new Error('Invalid menu item or quantity.');
            }

            const [menuRows] = await connection.query(`
                SELECT menu_id, item_name, category, price, availability
                FROM menu_items
                WHERE menu_id = ?
                FOR UPDATE
            `, [menuId]);

            if (!menuRows.length) {
                throw new Error(`Menu item ${menuId} not found.`);
            }

            const menuItem = menuRows[0];

            if (menuItem.availability !== 'Available') {
                throw new Error(`${menuItem.item_name} is unavailable.`);
            }

            const drink = isDrinkCategory(menuItem.category);
            const drinkSize = item.drink_size || null;

            if (drink && !VALID_DRINK_SIZES.has(drinkSize)) {
                throw new Error(
                    `Please choose 22oz or 24oz for ${menuItem.item_name}.`
                );
            }

            if (!drink && drinkSize !== null) {
                throw new Error(
                    `${menuItem.item_name} does not have a drink size option.`
                );
            }

            const price = Number(menuItem.price);
            const subtotal = Number((price * quantity).toFixed(2));
            totalAmount += subtotal;

            validatedItems.push({
                menu_id: Number(menuItem.menu_id),
                item_name: menuItem.item_name,
                category: menuItem.category,
                quantity,
                price,
                subtotal,
                drink_size: drinkSize
            });

            const supplies = getSuppliesForItem(menuItem.category, orderType);
            supplies.forEach((supplyName) => {
                const perItem = normalizeName(supplyName) === 'tissue' ? 0.10 : 1;
                const required = Number((perItem * quantity).toFixed(2));
                requiredSupplies.set(
                    supplyName,
                    Number(((requiredSupplies.get(supplyName) || 0) + required).toFixed(2))
                );
            });
        }

        // Lock all required inventory rows before checking and deducting stock.
        const supplyNames = [...requiredSupplies.keys()];
        const placeholders = supplyNames.map(() => '?').join(', ');
        const [inventoryRows] = await connection.query(`
            SELECT item_id, item_name, quantity, unit
            FROM inventory
            WHERE LOWER(TRIM(item_name)) IN (${placeholders})
            ORDER BY item_id
            FOR UPDATE
        `, supplyNames.map(normalizeName));

        // If an identical checkout completed while this request waited for
        // inventory locks, return that order instead of validating/deducting twice.
        const [duplicateRows] = await connection.query(
            'SELECT order_id FROM orders WHERE idempotency_key = ? LIMIT 1',
            [idempotencyKey]
        );
        if (duplicateRows.length) {
            await connection.rollback();
            return await orderModel.getOrderById(duplicateRows[0].order_id);
        }

        const inventoryByName = new Map();
        inventoryRows.forEach((row) => {
            const key = normalizeName(row.item_name);
            if (inventoryByName.has(key)) {
                throw new Error(
                    `Duplicate inventory records found for "${row.item_name}". Please correct inventory first.`
                );
            }
            inventoryByName.set(key, row);
        });

        const deductions = [];
        for (const [supplyName, required] of requiredSupplies.entries()) {
            const inventoryItem = inventoryByName.get(normalizeName(supplyName));

            if (!inventoryItem) {
                throw new Error(
                    `Required inventory item "${supplyName}" was not found. No order was saved.`
                );
            }

            const available = Number(inventoryItem.quantity);
            if (available + 0.000001 < required) {
                throw new Error(
                    `Insufficient ${inventoryItem.item_name}. Required: ${required.toFixed(2)} ${inventoryItem.unit}; Available: ${available.toFixed(2)} ${inventoryItem.unit}.`
                );
            }

            deductions.push({
                ...inventoryItem,
                required,
                remaining: Number((available - required).toFixed(2))
            });
        }

        const createdOrder = await orderModel.createOrder(
            connection,
            Number(totalAmount.toFixed(2)),
            orderType,
            idempotencyKey
        );

        await orderModel.createOrderItems(
            connection,
            createdOrder.order_id,
            validatedItems
        );

        for (const deduction of deductions) {
            await connection.query(`
                UPDATE inventory
                SET quantity = ?
                WHERE item_id = ?
            `, [deduction.remaining, deduction.item_id]);

            await connection.query(`
                INSERT INTO stock_movements
                    (item_id, movement_type, quantity, remarks, movement_date)
                VALUES (?, 'Stock Usage', ?, ?, NOW())
            `, [
                deduction.item_id,
                deduction.required,
                `Order #${createdOrder.daily_order_number} - ${orderType}`
            ]);
        }

        await connection.commit();

        return {
            order_id: createdOrder.order_id,
            daily_order_number: createdOrder.daily_order_number,
            order_type: orderType,
            total_amount: Number(totalAmount.toFixed(2)),
            status: 'Pending',
            items: validatedItems
        };
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Order rollback failed:', rollbackError);
        }

        // A simultaneous retry may win the unique idempotency-key insert.
        if (error.code === 'ER_DUP_ENTRY') {
            const duplicateOrder = await orderModel.getOrderByIdempotencyKey(idempotencyKey);
            if (duplicateOrder) return duplicateOrder;
        }

        throw error;
    } finally {
        connection.release();
    }
};

export const editOrderStatus = async (id, status) => {
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
    if (!allowedStatuses.includes(status)) {
        throw new Error('Invalid order status.');
    }

    const order = await orderModel.getOrderById(id);
    if (!order) throw new Error('Order not found.');

    return orderModel.updateOrderStatus(id, status);
};

export const removeOrder = async (id) => {
    const order = await orderModel.getOrderById(id);
    if (!order) throw new Error('Order not found.');
    return orderModel.deleteOrder(id);
};
