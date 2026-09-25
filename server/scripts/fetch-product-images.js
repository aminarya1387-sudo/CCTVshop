// ============================================================
// AMIN SYSTEM - دانلود خودکار عکس واقعی برای محصولات از اینترنت
// برای هر محصول بر اساس نام/دسته‌اش یک عبارت انگلیسی ساخته می‌شود،
// در Wikimedia Commons (عکس‌های آزاد) جستجو می‌شود و بهترین عکس داخل
// assets/products دانلود و به‌عنوان عکس اصلی محصول ثبت می‌شود.
//
// اجرا:   npm run images            (فقط محصولاتی که عکس اینترنتی ندارند)
//         npm run images -- --force (برای همه‌ی محصولات دوباره)
// ============================================================

const db = require('../db/database');
const { searchCommons, downloadCommonsImage } = require('../utils/commonsImages');

const force = process.argv.includes('--force');

// ===== کلمه‌های کلیدی نام محصول ← عبارت جستجوی انگلیسی =====
const QUERY_RULES = [
    [/پکیج|package|kit/i, 'CCTV cameras kit'],
    [/doorbell|زنگ/i, 'video doorbell'],
    [/ptz|چرخش/i, 'PTZ camera'],
    [/dome|دام/i, 'dome surveillance camera'],
    [/۳۶۰|360|پانوراما|fisheye/i, 'fisheye security camera'],
    [/مخفی|مینیاتوری|hidden|spy/i, 'miniature camera'],
    [/bullet|بولت|صنعتی|IP67/i, 'bullet CCTV camera'],
    [/nvr/i, 'network video recorder'],
    [/dvr/i, 'digital video recorder CCTV'],
    [/کابل|cable/i, 'coaxial cable'],
    [/براکت|bracket/i, 'camera wall mount bracket'],
    [/آداپتور|adapter|power/i, 'power adapter 12V'],
    [/هارد|hdd|disk/i, 'hard disk drive']
];

const CATEGORY_FALLBACK = {
    camera: 'CCTV camera',
    nvr: 'network video recorder',
    package: 'CCTV system',
    accessory: 'CCTV accessories'
};

function queryFor(product) {
    const rule = QUERY_RULES.find(([re]) => re.test(product.name));
    return rule ? rule[1] : (CATEGORY_FALLBACK[product.category] || 'surveillance camera');
}

function parseImages(row) {
    try {
        const list = JSON.parse(row.images || '[]');
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}


(async function run() {

    const products = db.prepare('SELECT * FROM products ORDER BY id').all();

    if (products.length === 0) {
        console.log('هیچ محصولی در دیتابیس نیست؛ اول npm run seed را اجرا کن.');
        return;
    }

    // یک عکس برای هر عبارت جستجو فقط یک بار استفاده می‌شود تا محصولات
    // مشابه عکس تکراری نگیرند
    const resultsCache = {};
    const usedUrls = new Set();

    let ok = 0;

    for (const product of products) {

        const current = parseImages(product);
        const alreadyHasDownloaded = current.some(img => String(img).startsWith('assets/products/'));

        if (alreadyHasDownloaded && !force) {
            console.log(`⏭  #${product.id} ${product.name} - از قبل عکس اینترنتی دارد`);
            continue;
        }

        const query = queryFor(product);

        try {

            resultsCache[query] = resultsCache[query] || await searchCommons(query, 10);

            const pick = resultsCache[query].find(img => !usedUrls.has(img.url)) || resultsCache[query][0];

            if (!pick) {
                console.log(`⚠️  #${product.id} ${product.name} - عکسی برای «${query}» پیدا نشد`);
                continue;
            }

            usedUrls.add(pick.url);

            const imagePath = await downloadCommonsImage(pick.url, `p${product.id}-${query}`, pick);

            // عکس جدید اول لیست (عکس اصلی)؛ عکس‌های قبلی به‌عنوان گالری می‌مانند
            const images = [imagePath, ...current.filter(img => !String(img).startsWith('assets/products/'))];

            db.prepare('UPDATE products SET image = ?, images = ? WHERE id = ?')
                .run(imagePath, JSON.stringify(images), product.id);

            ok++;

            console.log(`✅ #${product.id} ${product.name} ← ${pick.title} (${pick.license})`);

        } catch (e) {

            console.log(`❌ #${product.id} ${product.name} - ${e.message}`);

        }

    }

    console.log(`\n${ok} عکس دانلود و روی محصولات ثبت شد. منابع در assets/products/CREDITS.md ثبت شده‌اند.`);

})();
