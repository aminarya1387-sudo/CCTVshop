// ============================================================
// AMIN SYSTEM - PRODUCTS API (بخش مدیریتی، فقط روی admin-server.js)
// افزودن/ویرایش/حذف - فقط برای ادمین لاگین‌کرده با نقش درست.
// (خواندن محصولات برای همه در routes/products-public.js است)
// ============================================================

const express = require('express');
const db = require('../db/database');
const requireRole = require('../middleware/requireRole');
const { rowToProduct } = require('../utils/productMapper');

const router = express.Router();


// ===== POST /api/products - افزودن محصول جدید =====
router.post('/', requireRole('admin', 'products_manager'), (req, res) => {

    const { name, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'نام و قیمت الزامی است' });
    }

    // ===== لیست عکس‌ها: هم images[] (چندتایی جدید) و هم image تکی قدیمی پشتیبانی می‌شود =====
    const images = Array.isArray(req.body.images) && req.body.images.length > 0
        ? req.body.images
        : (req.body.image ? [req.body.image] : []);

    const insert = db.prepare(`
        INSERT INTO products
            (name, desc, longDesc, price, oldPrice, discount, icon, image, images, category, bestseller, discounted, stock)
        VALUES
            (@name, @desc, @longDesc, @price, @oldPrice, @discount, @icon, @image, @images, @category, @bestseller, @discounted, @stock)
    `);

    const result = insert.run({
        name,
        desc: req.body.desc || '',
        longDesc: req.body.longDesc || '',
        price,
        oldPrice: req.body.oldPrice || '',
        discount: req.body.discount || '',
        icon: req.body.icon || 'fa-camera-retro',
        image: images[0] || '',
        images: JSON.stringify(images),
        category: req.body.category || 'camera',
        bestseller: req.body.bestseller ? 1 : 0,
        discounted: req.body.discount ? 1 : 0,
        stock: req.body.stock !== undefined && req.body.stock !== '' ? Number(req.body.stock) : 20
    });

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(rowToProduct(created));

});


// ===== PUT /api/products/:id - ویرایش محصول =====
router.put('/:id', requireRole('admin', 'products_manager'), (req, res) => {

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!existing) {
        return res.status(404).json({ error: 'محصول پیدا نشد' });
    }

    const merged = { ...existing, ...req.body };

    // ===== لیست عکس‌ها: اگر images[] جدید فرستاده نشده، همان قبلی حفظ می‌شود =====
    const images = Array.isArray(req.body.images)
        ? req.body.images
        : (req.body.image !== undefined
            ? (req.body.image ? [req.body.image] : [])
            : (() => {
                if (existing.images) {
                    try {
                        const parsed = JSON.parse(existing.images);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed;
                        }
                    } catch (e) {
                        // داده خراب - به عکس تکی قدیمی برمی‌گردیم
                    }
                }
                return existing.image ? [existing.image] : [];
            })());

    db.prepare(`
        UPDATE products SET
            name = @name,
            desc = @desc,
            longDesc = @longDesc,
            price = @price,
            oldPrice = @oldPrice,
            discount = @discount,
            icon = @icon,
            image = @image,
            images = @images,
            category = @category,
            bestseller = @bestseller,
            discounted = @discounted,
            stock = @stock
        WHERE id = @id
    `).run({
        ...merged,
        id: req.params.id,
        image: images[0] || '',
        images: JSON.stringify(images),
        bestseller: merged.bestseller ? 1 : 0,
        discounted: merged.discounted ? 1 : 0,
        stock: merged.stock !== undefined && merged.stock !== '' ? Number(merged.stock) : 0
    });

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    res.json(rowToProduct(updated));

});


// ===== DELETE /api/products/:id - حذف محصول =====
router.delete('/:id', requireRole('admin', 'products_manager'), (req, res) => {

    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'محصول پیدا نشد' });
    }

    res.json({ success: true });

});


module.exports = router;
