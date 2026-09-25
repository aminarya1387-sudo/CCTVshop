// ============================================================
// AMIN SYSTEM - DATABASE (SQLite)
// از ماژول داخلی node:sqlite استفاده می‌کنیم؛ نیازی به نصب یا
// کامپایل پکیج جداگانه نیست (فقط Node.js نسبتاً جدید لازم است).
// باز کردن فایل دیتابیس و ساخت جدول‌ها (اگر وجود نداشته باشند)
// ============================================================

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'shop.db');

const db = new DatabaseSync(dbPath);

// حالت WAL: چون حالا دو سرور جدا (عمومی و مدیریت) هم‌زمان به همین
// فایل دیتابیس دسترسی دارند، این حالت خواندن/نوشتن هم‌زمان از چند
// پردازش را امن‌تر و بی‌قفل‌تر می‌کند.
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        desc TEXT,
        longDesc TEXT,
        price TEXT,
        oldPrice TEXT,
        discount TEXT,
        icon TEXT,
        image TEXT,
        category TEXT,
        bestseller INTEGER DEFAULT 0,
        discounted INTEGER DEFAULT 0
    )
`);

// ===== مهاجرت: ستون images (چند عکس، به‌صورت آرایه JSON) =====
// چون جدول products قبلاً وجود داشت، ستون جدید فقط در صورت نبودن اضافه می‌شود
const productColumns = db.prepare('PRAGMA table_info(products)').all();
if (!productColumns.some(col => col.name === 'images')) {
    db.exec('ALTER TABLE products ADD COLUMN images TEXT');
}

// ===== مهاجرت: ستون stock (موجودی انبار) =====
// مقدار پیش‌فرض ۲۰ هم برای محصولات قبلی و هم برای محصولات جدیدی
// که از این ستون چیزی نفرستند در نظر گرفته می‌شود
if (!productColumns.some(col => col.name === 'stock')) {
    db.exec('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 20');
}

db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT NOT NULL UNIQUE,
        customerName TEXT,
        customerPhone TEXT,
        customerCity TEXT,
        customerAddress TEXT,
        payment TEXT,
        itemsJson TEXT,
        totalCount INTEGER,
        totalPrice INTEGER,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT (datetime('now'))
    )
`);

// ===== مهاجرت: ستون customerId (اتصال سفارش به حساب کاربری مشتری) =====
const orderColumns = db.prepare('PRAGMA table_info(orders)').all();
if (!orderColumns.some(col => col.name === 'customerId')) {
    db.exec('ALTER TABLE orders ADD COLUMN customerId INTEGER');
}

// ===== حساب‌های کاربری مشتری‌ها (جدا از admin_users) =====
db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        name TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL,
        displayName TEXT
    )
`);

// ===== بنرهای اسلایدر صفحه اصلی (از پنل مدیریت قابل مدیریت است) =====
// theme: یکی از پوسته‌های رنگی آماده (ocean, neon, sunset, emerald, royal, midnight)
// startsAt/endsAt: بازه‌ی نمایش (اختیاری) - بیرون از بازه نمایش داده نمی‌شود
// countdownEnd: اگر پر باشد، روی بنر شمارش معکوس تا آن لحظه نشان داده می‌شود
// views/clicks: آمار نمایش و کلیک برای محاسبه‌ی CTR در پنل مدیریت
const bannersTableExisted = !!db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'banners'"
).get();

db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge TEXT,
        title TEXT NOT NULL,
        highlight TEXT,
        subtitle TEXT,
        buttonText TEXT,
        buttonLink TEXT,
        image TEXT,
        icon TEXT,
        theme TEXT DEFAULT 'ocean',
        countdownEnd TEXT,
        startsAt TEXT,
        endsAt TEXT,
        active INTEGER DEFAULT 1,
        sortOrder INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now'))
    )
`);

// فقط بار اولی که جدول ساخته می‌شود چند بنر پیش‌فرض ریخته می‌شود؛ اگر
// مدیر بعداً همه‌ی بنرها را حذف کند، دوباره پر نمی‌شود.
if (!bannersTableExisted) {
    require('./default-banners').forEach((b, index) => {
        db.prepare(`
            INSERT INTO banners (badge, title, highlight, subtitle, buttonText, buttonLink, image, icon, theme, countdownEnd, sortOrder)
            VALUES (@badge, @title, @highlight, @subtitle, @buttonText, @buttonLink, @image, @icon, @theme, @countdownEnd, @sortOrder)
        `).run({ ...b, sortOrder: index });
    });
}

module.exports = db;
