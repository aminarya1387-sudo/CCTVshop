// ===== ابزارهای مشترک بنرها =====
// (بین routes/banners-public.js و routes/banners-admin.js مشترک است)

const BANNER_THEMES = ['ocean', 'neon', 'sunset', 'emerald', 'royal', 'midnight'];


// تبدیل ردیف دیتابیس بنر به شکلی که فرانت‌اند انتظار دارد
function rowToBanner(row) {
    return {
        ...row,
        active: !!row.active,
        ctr: row.views > 0 ? Math.round((row.clicks / row.views) * 1000) / 10 : 0
    };
}


// آیا بنر همین الان باید نمایش داده شود؟ (فعال + داخل بازه‌ی زمانی)
function isBannerLive(row, now = Date.now()) {

    if (!row.active) return false;

    if (row.startsAt && Date.parse(row.startsAt) > now) return false;

    if (row.endsAt && Date.parse(row.endsAt) < now) return false;

    return true;

}


// لینک دکمه فقط مسیر داخلی سایت یا http(s) باشد (نه javascript: و مشابه)
function sanitizeLink(value) {

    const link = String(value || '').trim();

    if (!link) return '';

    if (/^https?:\/\//i.test(link)) return link;

    if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return '';

    return link;

}


// عکس فقط data:image، مسیر داخلی یا http(s) باشد
function sanitizeImage(value) {

    const img = String(value || '').trim();

    if (!img) return '';

    if (img.startsWith('data:image/')) return img;

    if (/^https?:\/\//i.test(img)) return img;

    if (/^[a-z][a-z0-9+.-]*:/i.test(img)) return '';

    return img;

}


// مقدار تاریخ ورودی را به ISO تبدیل می‌کند (یا رشته خالی)
function sanitizeDate(value) {

    if (!value) return '';

    const time = Date.parse(value);

    return Number.isNaN(time) ? '' : new Date(time).toISOString();

}


// آماده‌سازی فیلدهای ورودی فرم بنر برای ذخیره در دیتابیس
function bannerFieldsFromBody(body, fallback = {}) {

    const pick = key => (body[key] !== undefined ? body[key] : fallback[key]);

    const theme = pick('theme');

    return {
        badge: String(pick('badge') || '').trim(),
        title: String(pick('title') || '').trim(),
        highlight: String(pick('highlight') || '').trim(),
        subtitle: String(pick('subtitle') || '').trim(),
        buttonText: String(pick('buttonText') || '').trim(),
        buttonLink: sanitizeLink(pick('buttonLink')),
        image: sanitizeImage(pick('image')),
        icon: /^fa-[a-z0-9-]+$/.test(pick('icon') || '') ? pick('icon') : 'fa-camera-retro',
        theme: BANNER_THEMES.includes(theme) ? theme : 'ocean',
        countdownEnd: sanitizeDate(pick('countdownEnd')),
        startsAt: sanitizeDate(pick('startsAt')),
        endsAt: sanitizeDate(pick('endsAt')),
        active: pick('active') === undefined ? 1 : (pick('active') ? 1 : 0)
    };

}


module.exports = { BANNER_THEMES, rowToBanner, isBannerLive, bannerFieldsFromBody };
