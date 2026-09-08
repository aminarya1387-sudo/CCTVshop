// ============================================================
// AMIN SYSTEM - SEED ADMIN USERS
// ساخت ۳ حساب نمایشی با پسورد هش‌شده (نه متن ساده)
// اجرا: npm run seed:users
// ============================================================

const db = require('./database');
const { hashPassword } = require('../utils/password');

const users = [
    { username: 'admin', password: 'admin', role: 'admin', displayName: 'مدیر کل' },
    { username: 'products', password: 'products', role: 'products_manager', displayName: 'مسئول محصولات' },
    { username: 'orders', password: 'orders', role: 'orders_manager', displayName: 'مسئول سفارش‌ها' }
];

function seedUsers() {

    const existingCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c;

    if (existingCount > 0) {
        console.log(`جدول admin_users از قبل ${existingCount} حساب دارد؛ برای جلوگیری از تکرار، seed اجرا نشد.`);
        return;
    }

    const insert = db.prepare(`
        INSERT INTO admin_users (username, passwordHash, role, displayName)
        VALUES (@username, @passwordHash, @role, @displayName)
    `);

    users.forEach(u => {
        insert.run({
            username: u.username,
            passwordHash: hashPassword(u.password),
            role: u.role,
            displayName: u.displayName
        });
    });

    console.log(`${users.length} حساب ادمین با موفقیت ساخته شد (پسوردها هش‌شده ذخیره شدند).`);

}

seedUsers();
