import db from '../config/db.js';

const ORDER_SELECT = `
    SELECT
        o.order_id,
        o.daily_order_number,
        o.order_type,
        o.total_amount,
        o.status,
        o.order_date,
        oi.menu_id,
        mi.item_name,
        mi.category,
        oi.quantity,
        oi.price,
        oi.subtotal,
        oi.drink_size
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN menu_items mi ON oi.menu_id = mi.menu_id
`;

const mapOrderRows = (rows) => {
    if (!rows.length) return null;

    const first = rows[0];
    const order = {
        order_id: first.order_id,
        daily_order_number: first.daily_order_number,
        order_type: first.order_type || null,
        total_amount: Number(first.total_amount),
        status: first.status,
        order_date: first.order_date,
        items: []
    };

    rows.forEach((row) => {
        if (row.menu_id !== null) {
            order.items.push({
                menu_id: row.menu_id,
                item_name: row.item_name,
                category: row.category,
                quantity: Number(row.quantity),
                price: Number(row.price),
                subtotal: Number(row.subtotal),
                drink_size: row.drink_size || null
            });
        }
    });

    return order;
};

// GET ALL ORDERS
export const getAllOrders = async () => {
    const [rows] = await db.query(`
        ${ORDER_SELECT}
        ORDER BY o.order_date DESC, o.order_id DESC
    `);

    const grouped = new Map();
    rows.forEach((row) => {
        if (!grouped.has(row.order_id)) grouped.set(row.order_id, []);
        grouped.get(row.order_id).push(row);
    });

    return Array.from(grouped.values()).map(mapOrderRows);
};

// GET ORDER BY ID
export const getOrderById = async (id) => {
    const [rows] = await db.query(`
        ${ORDER_SELECT}
        WHERE o.order_id = ?
        ORDER BY oi.order_item_id ASC
    `, [id]);

    return mapOrderRows(rows);
};

// GET ORDER BY IDEMPOTENCY KEY
export const getOrderByIdempotencyKey = async (key) => {
    const [rows] = await db.query(
        'SELECT order_id FROM orders WHERE idempotency_key = ? LIMIT 1',
        [key]
    );

    return rows.length ? getOrderById(rows[0].order_id) : null;
};

// GET TODAY'S COMPLETED SALES
export const getTodaySales = async () => {
    const [rows] = await db.query(`
        SELECT
            COALESCE(SUM(total_amount), 0) AS today_sales,
            COUNT(*) AS completed_orders
        FROM orders
        WHERE status = 'Completed'
          AND DATE(order_date) = CURDATE()
    `);

    return {
        today_sales: Number(rows[0].today_sales),
        completed_orders: Number(rows[0].completed_orders)
    };
};

// CREATE ORDER WITH DAILY ORDER NUMBER
export const createOrder = async (
    connection,
    totalAmount,
    orderType,
    idempotencyKey
) => {
    const [dateRows] = await connection.query(
        'SELECT CURDATE() AS order_day'
    );
    const orderDay = dateRows[0].order_day;

    await connection.query(`
        INSERT IGNORE INTO daily_order_sequences (order_day, last_number)
        VALUES (?, 0)
    `, [orderDay]);

    const [sequenceRows] = await connection.query(`
        SELECT last_number
        FROM daily_order_sequences
        WHERE order_day = ?
        FOR UPDATE
    `, [orderDay]);

    const nextDailyNumber = Number(sequenceRows[0].last_number) + 1;

    await connection.query(`
        UPDATE daily_order_sequences
        SET last_number = ?
        WHERE order_day = ?
    `, [nextDailyNumber, orderDay]);

    const [result] = await connection.query(`
        INSERT INTO orders
            (daily_order_number, order_type, idempotency_key, total_amount, status, order_date)
        VALUES (?, ?, ?, ?, 'Pending', NOW())
    `, [nextDailyNumber, orderType, idempotencyKey, totalAmount]);

    return {
        order_id: result.insertId,
        daily_order_number: nextDailyNumber
    };
};

// CREATE ORDER ITEMS
export const createOrderItems = async (connection, orderId, items) => {
    for (const item of items) {
        await connection.query(`
            INSERT INTO order_items
                (order_id, menu_id, quantity, price, subtotal, drink_size)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            orderId,
            item.menu_id,
            item.quantity,
            item.price,
            item.subtotal,
            item.drink_size
        ]);
    }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (id, status) => {
    const [result] = await db.query(
        'UPDATE orders SET status = ? WHERE order_id = ?',
        [status, id]
    );
    return result.affectedRows > 0;
};

// DELETE ORDER
export const deleteOrder = async (id) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
        const [result] = await connection.query(
            'DELETE FROM orders WHERE order_id = ?',
            [id]
        );
        await connection.commit();
        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
