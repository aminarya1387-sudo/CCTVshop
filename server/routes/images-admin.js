// ============================================================
// AMIN SYSTEM - IMAGE SEARCH API (فقط روی admin-server.js)
// جستجوی عکس آزاد در اینترنت (Wikimedia Commons) و دانلود آن داخل
// assets/products تا روی محصول یا بنر استفاده شود.
// ============================================================

const express = require('express');
const requireRole = require('../middleware/requireRole');
const { searchCommons, downloadCommonsImage } = require('../utils/commonsImages');

const router = express.Router();

const canManage = requireRole('admin', 'products_manager');


// ===== GET /api/images/search?q=... =====
router.get('/search', canManage, async (req, res) => {

    const q = String(req.query.q || '').trim();

    if (!q) {
        return res.status(400).json({ error: 'عبارت جستجو خالی است' });
    }

    try {
        res.json(await searchCommons(q, 12));
    } catch (e) {
        res.status(502).json({ error: `اتصال به اینترنت یا Wikimedia Commons ممکن نشد (${e.message})` });
    }

});


// ===== POST /api/images/download { url, name, credit } =====
router.post('/download', canManage, async (req, res) => {

    const { url, name, credit } = req.body || {};

    if (!url) {
        return res.status(400).json({ error: 'آدرس عکس الزامی است' });
    }

    try {
        const imagePath = await downloadCommonsImage(url, name, credit);
        res.status(201).json({ path: imagePath });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }

});


module.exports = router;
