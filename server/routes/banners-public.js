// ============================================================
// AMIN SYSTEM - BANNERS API (بخش عمومی، روی سرور سایت)
// خواندن بنرهای فعال اسلایدر صفحه اصلی + ثبت آمار نمایش/کلیک.
// افزودن/ویرایش/حذف فقط روی سرور مدیریت است (routes/banners-admin.js).
// ============================================================

const express = require('express');
const db = require('../db/database');
const { rowToBanner, isBannerLive } = require('../utils/bannerMapper');

const router = express.Router();


// ===== GET /api/banners - بنرهای فعال و داخل بازه‌ی زمانی، به ترتیب =====
router.get('/', (req, res) => {

    const rows = db.prepare('SELECT * FROM banners ORDER BY sortOrder, id').all();

    const now = Date.now();

    // آمار داخلی (views/clicks) به بازدیدکننده‌ی عمومی داده نمی‌شود
    res.json(
        rows
            .filter(row => isBannerLive(row, now))
            .map(row => {
                const { views, clicks, ctr, ...banner } = rowToBanner(row);
                return banner;
            })
    );

});


// ===== POST /api/banners/:id/track - ثبت یک نمایش یا کلیک =====
router.post('/:id/track', (req, res) => {

    const type = req.body && req.body.type;

    if (type !== 'view' && type !== 'click') {
        return res.status(400).json({ error: 'نوع رویداد نامعتبر است' });
    }

    const column = type === 'view' ? 'views' : 'clicks';

    db.prepare(`UPDATE banners SET ${column} = ${column} + 1 WHERE id = ?`).run(req.params.id);

    res.json({ success: true });

});


module.exports = router;
