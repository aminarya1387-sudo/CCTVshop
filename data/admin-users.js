// ============================================================
// AMIN SYSTEM - ADMIN UI METADATA
//
// ⚠️ نکته: لیست حساب‌ها و پسوردها دیگر اینجا نیست - آن‌ها الان
// واقعاً روی سرور و به‌صورت هش‌شده در server/db/shop.db نگهداری
// می‌شوند (server/db/seed-users.js). این فایل فقط اطلاعات نمایشی
// (عنوان بخش‌های پنل و اینکه هر نقش به کدام دسترسی دارد) است تا
// سایدبار بتواند رابط کاربری درستی بسازد؛ خودِ اجازه دادن/ندادن
// همیشه توسط سرور تصمیم‌گیری می‌شود.
// ============================================================

// ===== تعریف صفحات پنل و اینکه هر نقش به کدام‌ها دسترسی دارد =====
const adminSections = [
    {
        key: 'dashboard',
        title: 'داشبورد',
        icon: 'fa-gauge-high',
        href: 'dashboard.html'
    },
    {
        key: 'products',
        title: 'محصولات',
        icon: 'fa-camera-retro',
        href: 'admin.html'
    },
    {
        key: 'banners',
        title: 'بنرهای اسلایدر',
        icon: 'fa-images',
        href: 'banners.html'
    },
    {
        key: 'orders',
        title: 'سفارش‌ها',
        icon: 'fa-receipt',
        href: 'orders.html'
    }
];

const rolePermissions = {
    admin: ['dashboard', 'products', 'banners', 'orders'],
    products_manager: ['dashboard', 'products', 'banners'],
    orders_manager: ['dashboard', 'orders']
};

const roleLabels = {
    admin: 'مدیر کل (دسترسی کامل)',
    products_manager: 'مسئول محصولات',
    orders_manager: 'مسئول سفارش‌ها'
};
