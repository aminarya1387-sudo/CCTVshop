// ============================================================
// AMIN SYSTEM - DEFAULT HOMEPAGE BANNERS
// بنرهای پیش‌فرض اسلایدر صفحه اصلی؛ فقط بار اولی که جدول banners
// ساخته می‌شود داخل دیتابیس ریخته می‌شوند (server/db/database.js).
// ============================================================

// پایان شمارش معکوس جشنواره: ۷ روز بعد از اولین اجرا
const inSevenDays = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

module.exports = [
    {
        badge: '🎉 جشنواره بزرگ فصل',
        title: 'تا',
        highlight: '۶۰٪ تخفیف ویژه',
        subtitle: 'بهترین دوربین‌های مداربسته + گارانتی ۲ ساله و نصب رایگان',
        buttonText: 'مشاهده همه تخفیف‌ها',
        buttonLink: 'pages/products.html?filter=discount',
        image: '',
        icon: 'fa-camera-retro',
        theme: 'ocean',
        countdownEnd: inSevenDays
    },
    {
        badge: '🤖 هوش مصنوعی',
        title: 'دوربین‌های',
        highlight: 'AI با تشخیص چهره',
        subtitle: 'تشخیص انسان و خودرو، هشدار لحظه‌ای روی موبایل و دید رنگی در شب',
        buttonText: 'مشاهده دوربین‌ها',
        buttonLink: 'pages/products.html?cat=camera',
        image: '',
        icon: 'fa-eye',
        theme: 'neon',
        countdownEnd: ''
    },
    {
        badge: '📦 پکیج کامل',
        title: 'پکیج‌های آماده',
        highlight: 'نصب رایگان',
        subtitle: 'دوربین + NVR + کابل و اتصالات؛ همه‌چیز برای یک سیستم نظارتی کامل',
        buttonText: 'مشاهده پکیج‌ها',
        buttonLink: 'pages/products.html?cat=package',
        image: '',
        icon: 'fa-box-open',
        theme: 'sunset',
        countdownEnd: ''
    }
];
