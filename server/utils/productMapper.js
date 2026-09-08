// ===== تبدیل ردیف دیتابیس محصول به شکلی که فرانت‌اند انتظار دارد =====
// (بین routes/products-public.js و routes/products-admin.js مشترک است)

// ===== آرایه‌ی عکس‌ها را از ستون images (JSON) بخوان؛ اگر خالی بود، =====
// ===== به عکس تکی قدیمی (image) برگرد (سازگاری با داده‌های قدیمی) =====
function parseImages(row) {
    if (row.images) {
        try {
            const parsed = JSON.parse(row.images);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            // داده خراب - نادیده گرفته می‌شود
        }
    }
    return row.image ? [row.image] : [];
}

function rowToProduct(row) {
    const images = parseImages(row);
    return {
        ...row,
        images,
        image: images[0] || '',
        bestseller: !!row.bestseller,
        discounted: !!row.discounted
    };
}

module.exports = { rowToProduct };
