import bcrypt from 'bcryptjs';
import db from './config/db.js';

async function createAdmin() {
    try {
        const username = 'admin';
        const password = 'Admin123!';
        const fullName = "Kape't Balay Administrator";

        const [existing] = await db.query(
            'SELECT staff_id FROM staff WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            console.log('Admin account already exists!');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO staff (username, password, full_name)
             VALUES (?, ?, ?)`,
            [username, hashedPassword, fullName]
        );

        console.log('Admin account created successfully!');
        console.log('Username:', username);
        console.log('Password:', password);

    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        await db.end();
    }
}

createAdmin();
