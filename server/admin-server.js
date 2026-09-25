// ============================================================
// AMIN SYSTEM - ADMIN SERVER
// این سرور کاملاً از سایت عمومی (server.js) جداست و فقط پنل
// مدیریت را سرو می‌کند. با HOST پایین (پیش‌فرض 127.0.0.1) روی
// اینترنت عمومی اصلاً در دسترس نیست - فقط از خودِ همین کامپیوتر.
//
// وقتی سرور واقعی + VPN آماده شد، فقط کافیست متغیر محیطی
// ADMIN_HOST را به آی‌پی خصوصیِ اینترفیس VPN تغییر بدهی (مثلاً
// 10.8.0.1) تا فقط از داخل VPN در دسترس باشد.
// ============================================================

const path = require('path');
const express = require('express');
const session = require('express-session');

const authRouter = require('./routes/auth');
const productsPublicRouter = require('./routes/products-public'); // GET (برای نمایش جدول محصولات در پنل)
const productsAdminRouter = require('./routes/products-admin');   // POST/PUT/DELETE
const ordersAdminRouter = require('./routes/orders-admin');
const bannersPublicRouter = require('./routes/banners-public');    // GET بنرهای فعال (برای پیش‌نمایش)
const bannersAdminRouter = require('./routes/banners-admin');      // لیست کامل + افزودن/ویرایش/حذف
const imagesAdminRouter = require('./routes/images-admin');        // جستجو/دانلود عکس از اینترنت

const app = express();

const PORT = process.env.ADMIN_PORT || 4000;

// ⚠️ فقط 127.0.0.1 (لوپ‌بک/خودِ همین کامپیوتر). روی سرور واقعی این
// را به آی‌پی خصوصیِ VPN تغییر بده، نه 0.0.0.0.
const HOST = process.env.ADMIN_HOST || '127.0.0.1';

const PROJECT_ROOT = path.join(__dirname, '..');
const ADMIN_ROOT = path.join(PROJECT_ROOT, 'admin');


// ===== خواندن JSON از بدنه درخواست‌ها =====
app.use(express.json({ limit: '5mb' }));


// ===== نشست (Session) برای لاگین ادمین =====
app.use(session({
    secret: process.env.ADMIN_SESSION_SECRET || 'persianblue-cctv-admin-dev-secret-CHANGE-ME',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8 // ۸ ساعت
    }
}));


// ===== API مدیریتی =====
// (products-public قبل از products-admin مانت می‌شود تا GET برای
//  نمایش جدول کار کند؛ POST/PUT/DELETE توسط products-admin است)
app.use('/api/auth', authRouter);
app.use('/api/products', productsPublicRouter);
app.use('/api/products', productsAdminRouter);
app.use('/api/orders', ordersAdminRouter);
app.use('/api/banners', bannersAdminRouter);
app.use('/api/banners', bannersPublicRouter);
app.use('/api/images', imagesAdminRouter);


// ===== فایل‌های مشترک (استایل/اسکریپت) که پنل ادمین هم لازم دارد =====
app.use('/css', express.static(path.join(PROJECT_ROOT, 'css')));
app.use('/js', express.static(path.join(PROJECT_ROOT, 'js')));
app.use('/data', express.static(path.join(PROJECT_ROOT, 'data')));
app.use('/assets', express.static(path.join(PROJECT_ROOT, 'assets')));


// ===== خودِ صفحات پنل مدیریت (روی ریشه‌ی همین سرور) =====
app.use(express.static(ADMIN_ROOT, { index: 'login.html' }));


app.listen(PORT, HOST, () => {
    console.log(`🔒 سرور مدیریت AMIN SYSTEM روی http://${HOST}:${PORT} در حال اجراست (فقط شبکه‌ی داخلی)`);
});
