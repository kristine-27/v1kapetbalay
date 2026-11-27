import * as orderService from '../services/orderService.js';

export const getOrders = async (req, res) => {
    try {
        const orders = await orderService.getOrderList();
        return res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders.',
            error: error.message
        });
    }
};

export const getTodaySales = async (req, res) => {
    try {
        const sales = await orderService.getTodaySalesSummary();
        return res.status(200).json({ success: true, data: sales });
    } catch (error) {
        console.error('Error fetching today sales:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch today sales.',
            error: error.message
        });
    }
};

export const getOrder = async (req, res) => {
    try {
        const order = await orderService.getOrderDetails(req.params.id);
        return res.status(200).json({ success: true, data: order });
    } catch (error) {
        const statusCode = error.message === 'Order not found.' ? 404 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { items, order_type, idempotency_key } = req.body || {};
        const order = await orderService.addOrder(items, order_type, idempotency_key);

        return res.status(201).json({
            success: true,
            message: 'Order saved successfully.',
            data: order
        });
    } catch (error) {
        console.error('Error saving order:', error);

        const validationMessages = [
            'Order must contain at least one item.',
            'Invalid menu item or quantity.',
            'Please select a valid order type: Dine In or Take Out.',
            'Invalid checkout request key. Please try checkout again.'
        ];

        const isValidationError =
            validationMessages.includes(error.message) ||
            /not found|unavailable|Please choose|does not have|Insufficient|Duplicate inventory|Unsupported menu category/i.test(error.message);

        return res.status(isValidationError ? 400 : 500).json({
            success: false,
            message: 'Failed to save order.',
            error: error.message
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        await orderService.editOrderStatus(id, status);

        return res.status(200).json({
            success: true,
            message: `Order #${id} updated to ${status}.`
        });
    } catch (error) {
        const statusCode = error.message === 'Order not found.' ? 404 : 400;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await orderService.removeOrder(id);
        return res.status(200).json({
            success: true,
            message: `Order #${id} deleted successfully.`
        });
    } catch (error) {
        const statusCode = error.message === 'Order not found.' ? 404 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};
