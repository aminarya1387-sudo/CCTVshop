// ============================================================
// AMIN SYSTEM - PUBLIC SERVER
// فقط سایت عمومی (فروشگاه) را سرو می‌کند - نه پنل مدیریت.
// پنل مدیریت کاملاً جدا و روی admin-server.js اجرا می‌شود (فقط
// از شبکه‌ی داخلی/VPN در دسترس است، نه اینترنت عمومی).
// ============================================================

const path = require('path');
const express = require('express');
const session = require('express-session');

const productsPublicRouter = require('./routes/products-public');
const ordersPublicRouter = require('./routes/orders-public');
const customersRouter = require('./routes/customers');
const bannersPublicRouter = require('./routes/banners-public');

const app = express();

const PORT = process.env.PORT || 3000;

// این سرور روی همه‌ی اینترفیس‌های شبکه گوش می‌دهد (عمومی/در دسترس همه)
const HOST = process.env.HOST || '0.0.0.0';

const PROJECT_ROOT = path.join(__dirname, '..');


// ===== خواندن JSON از بدنه درخواست‌ها =====
app.use(express.json({ limit: '5mb' }));


// ===== نشست (Session) برای حساب کاربری مشتری‌ها =====
// جدا از نشست پنل مدیریت (که فقط روی admin-server.js تعریف شده)
app.use(session({
    secret: process.env.CUSTOMER_SESSION_SECRET || 'amin-system-customer-dev-secret-CHANGE-ME',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30 // ۳۰ روز
    }
}));


// ===== API عمومی (خواندن محصولات + ثبت/پیگیری سفارش + حساب کاربری) =====
app.use('/api/products', productsPublicRouter);
app.use('/api/orders', ordersPublicRouter);
app.use('/api/customers', customersRouter);
app.use('/api/banners', bannersPublicRouter);


// ===== سرو کردن فایل‌های سایت عمومی =====
// عمداً از express.static(PROJECT_ROOT) استفاده نمی‌شود، چون آن کل
// پوشه‌ی پروژه (از جمله admin/ و کد سرور) را عمومی می‌کند. فقط
// پوشه‌های زیر و خودِ index.html به‌صورت صریح سرو می‌شوند.
app.use('/css', express.static(path.join(PROJECT_ROOT, 'css')));
app.use('/js', express.static(path.join(PROJECT_ROOT, 'js')));
app.use('/data', express.static(path.join(PROJECT_ROOT, 'data')));
app.use('/assets', express.static(path.join(PROJECT_ROOT, 'assets')));
app.use('/pages', express.static(path.join(PROJECT_ROOT, 'pages')));

app.get('/', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'index.html'));
});


app.listen(PORT, HOST, () => {
    console.log(`✅ سرور عمومی AMIN SYSTEM روی http://localhost:${PORT} در حال اجراست`);
});
