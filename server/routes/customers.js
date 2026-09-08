// ============================================================
// AMIN SYSTEM - CUSTOMER ACCOUNTS API (بخش عمومی، روی سرور سایت)
// ثبت‌نام / ورود / خروج مشتری‌ها با شماره موبایل + رمز عبور.
// جدا از پنل مدیریت (server/routes/auth.js) است.
// ============================================================

const express = require('express');
const db = require('../db/database');
const { hashPassword, verifyPassword } = require('../utils/password');
const { normalizePhone } = require('../utils/orderMapper');

const router = express.Router();


function toPublicCustomer(row) {
    return {
        id: row.id,
        phone: row.phone,
        name: row.name
    };
}


// ===== POST /api/customers/register - ثبت‌نام =====
router.post('/register', (req, res) => {

    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ error: 'نام، شماره موبایل و رمز عبور الزامی است' });
    }

    if (password.length < 4) {
        return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' });
    }

    const normalizedPhone = normalizePhone(phone);

    const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(normalizedPhone);

    if (existing) {
        return res.status(409).json({ error: 'حسابی با این شماره موبایل قبلاً ثبت شده؛ وارد شوید' });
    }

    const result = db.prepare(`
        INSERT INTO customers (phone, passwordHash, name)
        VALUES (@phone, @passwordHash, @name)
    `).run({
        phone: normalizedPhone,
        passwordHash: hashPassword(password),
        name: name.trim()
    });

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    req.session.customer = toPublicCustomer(created);

    res.status(201).json(req.session.customer);

});


// ===== POST /api/customers/login - ورود =====
router.post('/login', (req, res) => {

    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: 'شماره موبایل و رمز عبور الزامی است' });
    }

    const normalizedPhone = normalizePhone(phone);

    const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(normalizedPhone);

    if (!customer || !verifyPassword(password, customer.passwordHash)) {
        return res.status(401).json({ error: 'شماره موبایل یا رمز عبور اشتباه است' });
    }

    req.session.customer = toPublicCustomer(customer);

    res.json(req.session.customer);

});


// ===== POST /api/customers/logout - خروج =====
router.post('/logout', (req, res) => {

    req.session.destroy(() => {
        res.json({ success: true });
    });

});


// ===== GET /api/customers/me - آیا نشستی فعال است؟ =====
router.get('/me', (req, res) => {

    if (!req.session.customer) {
        return res.status(401).json({ error: 'وارد نشده‌اید' });
    }

    res.json(req.session.customer);

});


module.exports = router;
