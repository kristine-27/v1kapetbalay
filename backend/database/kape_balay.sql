CREATE DATABASE IF NOT EXISTS kapet_balay_db;
USE kapet_balay_db;

CREATE TABLE IF NOT EXISTS staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    movement_type ENUM('Stock In', 'Stock Usage') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    remarks VARCHAR(255),
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movements_inventory
        FOREIGN KEY (item_id) REFERENCES inventory(item_id)
);

CREATE TABLE IF NOT EXISTS menu_items (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    availability ENUM('Available', 'Unavailable') DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS daily_order_sequences (
    order_day DATE PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    daily_order_number INT NULL,
    order_type ENUM('Dine In', 'Take Out') NULL,
    idempotency_key VARCHAR(64) NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('Pending', 'Preparing', 'Ready', 'Completed') DEFAULT 'Pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orders_idempotency_key (idempotency_key)
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    drink_size ENUM('22oz', '24oz') NULL,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_menu
        FOREIGN KEY (menu_id) REFERENCES menu_items(menu_id)
);
