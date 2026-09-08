// ============================================================
// AMIN SYSTEM - PRODUCTS API (بخش عمومی، روی سرور سایت)
// فقط خواندن؛ برای افزودن/ویرایش/حذف به routes/products-admin.js
// روی سرور مدیریت (admin-server.js) مراجعه کن.
// ============================================================

const express = require('express');
const db = require('../db/database');
const { rowToProduct } = require('../utils/productMapper');

const router = express.Router();


// ===== GET /api/products - لیست همه محصولات =====
router.get('/', (req, res) => {

    const rows = db.prepare('SELECT * FROM products ORDER BY id').all();

    res.json(rows.map(rowToProduct));

});


// ===== GET /api/products/:id - یک محصول =====
router.get('/:id', (req, res) => {

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!row) {
        return res.status(404).json({ error: 'محصول پیدا نشد' });
    }

    res.json(rowToProduct(row));

});


module.exports = router;
