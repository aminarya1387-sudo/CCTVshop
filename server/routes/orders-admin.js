// ============================================================
// AMIN SYSTEM - ORDERS API (بخش مدیریتی، فقط روی admin-server.js)
// دیدن لیست سفارش‌ها و تغییر وضعیت - فقط ادمین لاگین‌کرده.
// (ثبت سفارش و پیگیری عمومی در routes/orders-public.js است)
// ============================================================

const express = require('express');
const db = require('../db/database');
const requireRole = require('../middleware/requireRole');
const { rowToOrder } = require('../utils/orderMapper');

const router = express.Router();


// ===== GET /api/orders - لیست همه سفارش‌ها =====
router.get('/', requireRole('admin', 'orders_manager'), (req, res) => {

    const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();

    res.json(rows.map(rowToOrder));

});


// ===== PATCH /api/orders/:id/status - تغییر وضعیت سفارش =====
router.patch('/:id/status', requireRole('admin', 'orders_manager'), (req, res) => {

    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'وضعیت نامعتبر است' });
    }

    const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'سفارش پیدا نشد' });
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    res.json(rowToOrder(updated));

});


module.exports = router;
