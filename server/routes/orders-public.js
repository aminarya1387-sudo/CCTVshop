// ============================================================
// AMIN SYSTEM - ORDERS API (بخش عمومی، روی سرور سایت)
// ثبت سفارش از تسویه‌حساب + پیگیری سفارش با کد و موبایل.
// دیدن لیست همه سفارش‌ها و تغییر وضعیت فقط روی سرور مدیریت است
// (routes/orders-admin.js).
// ============================================================

const express = require('express');
const db = require('../db/database');
const { normalizePhone, rowToOrder, generateOrderNumber } = require('../utils/orderMapper');

const router = express.Router();


// ===== POST /api/orders - ثبت سفارش جدید (نیاز به ورود با حساب کاربری) =====
router.post('/', (req, res) => {

    if (!req.session.customer) {
        return res.status(401).json({ error: 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید' });
    }

    const { customer, payment, items, totalCount, totalPrice } = req.body;

    if (!customer || !customer.name || !customer.phone || !items || items.length === 0) {
        return res.status(400).json({ error: 'اطلاعات سفارش ناقص است' });
    }

    // ===== بررسی موجودی انبار قبل از ثبت سفارش =====
    for (const item of items) {

        const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(item.id);

        if (!product) {
            return res.status(400).json({ error: `محصول «${item.name}» دیگر در فروشگاه موجود نیست` });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({
                error: product.stock > 0
                    ? `موجودی «${product.name}» کافی نیست (فقط ${product.stock} عدد باقی مانده)`
                    : `«${product.name}» موقتاً ناموجود است`
            });
        }

    }

    let orderNumber = generateOrderNumber();

    // اطمینان از یکتا بودن کد سفارش
    while (db.prepare('SELECT 1 FROM orders WHERE orderNumber = ?').get(orderNumber)) {
        orderNumber = generateOrderNumber();
    }

    const insert = db.prepare(`
        INSERT INTO orders
            (orderNumber, customerId, customerName, customerPhone, customerCity, customerAddress, payment, itemsJson, totalCount, totalPrice, status)
        VALUES
            (@orderNumber, @customerId, @customerName, @customerPhone, @customerCity, @customerAddress, @payment, @itemsJson, @totalCount, @totalPrice, 'pending')
    `);

    const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    let result;

    db.exec('BEGIN');

    try {

        items.forEach(item => {
            decrementStock.run(item.quantity, item.id);
        });

        result = insert.run({
            orderNumber,
            customerId: req.session.customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerCity: customer.city || '',
            customerAddress: customer.address || '',
            payment: payment || 'cod',
            itemsJson: JSON.stringify(items),
            totalCount: totalCount || 0,
            totalPrice: totalPrice || 0
        });

        db.exec('COMMIT');

    } catch (e) {

        db.exec('ROLLBACK');
        throw e;

    }

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(rowToOrder(created));

});


// ===== GET /api/orders/mine - تاریخچه سفارش‌های حساب کاربری فعلی =====
router.get('/mine', (req, res) => {

    if (!req.session.customer) {
        return res.status(401).json({ error: 'وارد نشده‌اید' });
    }

    const rows = db.prepare('SELECT * FROM orders WHERE customerId = ? ORDER BY id DESC').all(req.session.customer.id);

    res.json(rows.map(rowToOrder));

});


// ===== GET /api/orders/track?code=..&phone=.. - پیگیری سفارش =====
router.get('/track', (req, res) => {

    const { code, phone } = req.query;

    if (!code || !phone) {
        return res.status(400).json({ error: 'کد سفارش و شماره موبایل الزامی است' });
    }

    const row = db.prepare(`
        SELECT * FROM orders
        WHERE orderNumber = ? COLLATE NOCASE
    `).get(code.trim());

    // مقایسه شماره موبایل بعد از نرمال‌سازی (رقم فارسی/عربی، فاصله و ...)
    if (!row || normalizePhone(row.customerPhone) !== normalizePhone(phone)) {
        return res.status(404).json({ error: 'سفارشی با این کد و شماره موبایل پیدا نشد' });
    }

    res.json(rowToOrder(row));

});


module.exports = router;
