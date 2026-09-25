// ============================================================
// AMIN SYSTEM - BANNERS API (بخش مدیریتی، فقط روی admin-server.js)
// لیست کامل (با آمار)، افزودن، ویرایش، مرتب‌سازی و حذف بنرها.
// ============================================================

const express = require('express');
const db = require('../db/database');
const requireRole = require('../middleware/requireRole');
const { rowToBanner, bannerFieldsFromBody } = require('../utils/bannerMapper');

const router = express.Router();

const canManage = requireRole('admin', 'products_manager');


// ===== GET /api/banners/all - همه‌ی بنرها (حتی غیرفعال) با آمار =====
router.get('/all', canManage, (req, res) => {

    const rows = db.prepare('SELECT * FROM banners ORDER BY sortOrder, id').all();

    res.json(rows.map(rowToBanner));

});


// ===== POST /api/banners - افزودن بنر جدید (به انتهای لیست) =====
router.post('/', canManage, (req, res) => {

    const fields = bannerFieldsFromBody(req.body);

    if (!fields.title) {
        return res.status(400).json({ error: 'عنوان بنر الزامی است' });
    }

    const maxOrder = db.prepare('SELECT COALESCE(MAX(sortOrder), -1) AS m FROM banners').get().m;

    const result = db.prepare(`
        INSERT INTO banners
            (badge, title, highlight, subtitle, buttonText, buttonLink, image, icon, theme, countdownEnd, startsAt, endsAt, active, sortOrder)
        VALUES
            (@badge, @title, @highlight, @subtitle, @buttonText, @buttonLink, @image, @icon, @theme, @countdownEnd, @startsAt, @endsAt, @active, @sortOrder)
    `).run({ ...fields, sortOrder: maxOrder + 1 });

    const created = db.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(rowToBanner(created));

});


// ===== PUT /api/banners/reorder - ذخیره‌ی ترتیب جدید (آرایه‌ی آیدی‌ها) =====
router.put('/reorder', canManage, (req, res) => {

    const ids = req.body && req.body.ids;

    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'لیست ترتیب نامعتبر است' });
    }

    const update = db.prepare('UPDATE banners SET sortOrder = ? WHERE id = ?');

    db.exec('BEGIN');

    try {
        ids.forEach((id, index) => update.run(index, Number(id)));
        db.exec('COMMIT');
    } catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }

    res.json({ success: true });

});


// ===== PUT /api/banners/:id - ویرایش بنر =====
router.put('/:id', canManage, (req, res) => {

    const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);

    if (!existing) {
        return res.status(404).json({ error: 'بنر پیدا نشد' });
    }

    const fields = bannerFieldsFromBody(req.body, existing);

    if (!fields.title) {
        return res.status(400).json({ error: 'عنوان بنر الزامی است' });
    }

    db.prepare(`
        UPDATE banners SET
            badge = @badge,
            title = @title,
            highlight = @highlight,
            subtitle = @subtitle,
            buttonText = @buttonText,
            buttonLink = @buttonLink,
            image = @image,
            icon = @icon,
            theme = @theme,
            countdownEnd = @countdownEnd,
            startsAt = @startsAt,
            endsAt = @endsAt,
            active = @active
        WHERE id = @id
    `).run({ ...fields, id: req.params.id });

    const updated = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);

    res.json(rowToBanner(updated));

});


// ===== DELETE /api/banners/:id - حذف بنر =====
router.delete('/:id', canManage, (req, res) => {

    const result = db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'بنر پیدا نشد' });
    }

    res.json({ success: true });

});


module.exports = router;
