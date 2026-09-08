// ============================================================
// AMIN SYSTEM - SEED SCRIPT
// ریختن ۲۰ محصول پیش‌فرض data/catalog.js داخل دیتابیس
// اجرا: npm run seed
// ============================================================

const path = require('path');
const db = require('./database');

const defaultCatalogProducts = require(path.join(__dirname, '..', '..', 'data', 'catalog.js'));

function seed() {

    const existingCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;

    if (existingCount > 0) {
        console.log(`جدول محصولات از قبل ${existingCount} ردیف دارد؛ برای جلوگیری از تکرار، seed اجرا نشد.`);
        console.log('اگر می‌خواهی از نو پر شود، اول فایل server/db/shop.db را حذف کن.');
        return;
    }

    const insert = db.prepare(`
        INSERT INTO products
            (name, desc, longDesc, price, oldPrice, discount, icon, image, category, bestseller, discounted)
        VALUES
            (@name, @desc, @longDesc, @price, @oldPrice, @discount, @icon, @image, @category, @bestseller, @discounted)
    `);

    db.exec('BEGIN');

    try {

        defaultCatalogProducts.forEach(p => {
            insert.run({
                name: p.name,
                desc: p.desc || '',
                longDesc: p.longDesc || '',
                price: p.price,
                oldPrice: p.oldPrice || '',
                discount: p.discount || '',
                icon: p.icon || 'fa-camera-retro',
                image: p.image || '',
                category: p.category,
                bestseller: p.bestseller ? 1 : 0,
                discounted: p.discounted ? 1 : 0
            });
        });

        db.exec('COMMIT');

    } catch (e) {

        db.exec('ROLLBACK');

        throw e;

    }

    console.log(`${defaultCatalogProducts.length} محصول با موفقیت داخل دیتابیس ریخته شد.`);

}

seed();
