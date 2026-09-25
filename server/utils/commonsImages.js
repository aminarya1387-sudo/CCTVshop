// ============================================================
// AMIN SYSTEM - جستجو و دانلود عکس از Wikimedia Commons
// عکس‌های Commons آزاد (Public Domain / CC0 / CC BY / CC BY-SA) هستند؛
// برای مجوزهای CC BY نام سازنده در assets/products/CREDITS.md ثبت می‌شود.
// (بین routes/images-admin.js و scripts/fetch-product-images.js مشترک است)
// ============================================================

const fs = require('fs');
const path = require('path');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const ALLOWED_DOWNLOAD_HOST = 'upload.wikimedia.org';
const USER_AGENT = 'AminSystemShop/1.0 (product image fetcher)';

const PRODUCTS_DIR = path.join(__dirname, '..', '..', 'assets', 'products');
const CREDITS_FILE = path.join(PRODUCTS_DIR, 'CREDITS.md');

// فقط مجوزهایی که استفاده‌ی تجاری را مجاز می‌کنند
const FREE_LICENSE = /^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)/i;


function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, '').trim();
}


// ===== جستجوی عکس در Commons؛ خروجی: [{ title, thumb, url, license, author, sourcePage }] =====
async function searchCommons(query, limit = 12) {

    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrnamespace: '6',
        gsrlimit: String(Math.min(limit * 2, 40)),
        gsrsearch: `${query} filetype:bitmap`,
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size|mime',
        iiurlwidth: '800'
    });

    const res = await fetch(`${COMMONS_API}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
        throw new Error(`Commons پاسخ ${res.status} داد`);
    }

    const data = await res.json();

    const pages = Object.values((data.query && data.query.pages) || {})
        .sort((a, b) => (a.index || 0) - (b.index || 0));

    return pages
        .map(page => {

            const info = (page.imageinfo || [])[0];

            if (!info) return null;

            const meta = info.extmetadata || {};

            return {
                title: page.title.replace(/^File:/, ''),
                thumb: info.thumburl || info.url,
                url: info.thumburl || info.url,
                width: info.width,
                height: info.height,
                mime: info.mime,
                license: stripHtml(meta.LicenseShortName && meta.LicenseShortName.value),
                author: stripHtml(meta.Artist && meta.Artist.value).slice(0, 120),
                sourcePage: info.descriptionurl
            };

        })
        .filter(img => img
            && /^image\/(jpeg|png|webp)$/.test(img.mime)
            && FREE_LICENSE.test(img.license)
            && img.width >= 300)
        .slice(0, limit);

}


// ===== دانلود یک عکس از upload.wikimedia.org داخل assets/products =====
// خروجی: مسیر نسبی قابل استفاده در سایت (مثلاً assets/products/p12-....jpg)
async function downloadCommonsImage(url, baseName, credit) {

    const parsed = new URL(url);

    // جلوگیری از SSRF: فقط از هاست عکس‌های ویکی‌مدیا دانلود می‌شود
    if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_DOWNLOAD_HOST) {
        throw new Error('فقط دانلود از upload.wikimedia.org مجاز است');
    }

    const res = await fetch(parsed, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'error', // ریدایرکت به هاست دیگر نباید محدودیت بالا را دور بزند
        signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
        throw new Error(`دانلود عکس با خطای ${res.status} مواجه شد`);
    }

    const type = res.headers.get('content-type') || '';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';

    if (!/^image\//.test(type)) {
        throw new Error('فایل دانلودشده عکس نیست');
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('حجم عکس بیشتر از ۵ مگابایت است');
    }

    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

    const safeBase = String(baseName || 'image').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'image';
    const fileName = `${safeBase}-${Date.now().toString(36)}.${ext}`;

    fs.writeFileSync(path.join(PRODUCTS_DIR, fileName), buffer);

    if (credit) {
        appendCredit(fileName, credit);
    }

    return `assets/products/${fileName}`;

}


// ===== ثبت منبع و مجوز عکس (الزام مجوزهای CC BY) =====
function appendCredit(fileName, credit) {

    if (!fs.existsSync(CREDITS_FILE)) {
        fs.writeFileSync(
            CREDITS_FILE,
            '# منابع عکس‌های محصولات\n\nعکس‌های این پوشه از Wikimedia Commons و با مجوز آزاد دانلود شده‌اند.\n\n| فایل | عنوان | سازنده | مجوز | منبع |\n|---|---|---|---|---|\n'
        );
    }

    const cell = v => String(v || '-').replace(/\|/g, '/').replace(/\n/g, ' ');

    fs.appendFileSync(
        CREDITS_FILE,
        `| ${cell(fileName)} | ${cell(credit.title)} | ${cell(credit.author)} | ${cell(credit.license)} | ${cell(credit.sourcePage)} |\n`
    );

}


module.exports = { searchCommons, downloadCommonsImage };
