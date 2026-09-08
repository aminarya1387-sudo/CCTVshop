// ============================================================
// AMIN SYSTEM - CATALOG SEED DATA
// (داده‌ی اولیه محصولات - فقط یک بار در اولین بازدید داخل
//  localStorage کپی می‌شود، بعد از آن منبع اصلی ProductStore است)
//
// category: 'camera' | 'nvr' | 'package' | 'accessory'
// image: مسیر عکس (اختیاری) - اگر نباشد از icon استفاده می‌شود
// ============================================================

const defaultCatalogProducts = [

    // ===== دوربین‌ها =====
    {
        id: 1,
        name: 'دوربین Bullet 4K Ultra',
        desc: 'دید در شب ۵۰ متر، مقاوم در برابر آب و گردوغبار',
        price: '۱۱۳',
        oldPrice: '۱۸۹',
        discount: '۴۰٪',
        icon: 'fa-camera-retro',
        image: 'assets/Untitled.jpg',
        category: 'camera',
        bestseller: true,
        discounted: true
    },
    {
        id: 2,
        name: 'دوربین Dome 5MP AI',
        desc: 'تشخیص چهره، صدای دوطرفه، زوم ۴ برابر اپتیکال',
        price: '۱۱۱',
        oldPrice: '۱۵۹',
        discount: '۳۰٪',
        icon: 'fa-eye',
        image: 'assets/images.jpg',
        category: 'camera',
        bestseller: true,
        discounted: true
    },
    {
        id: 3,
        name: 'دوربین PTZ وایرلس',
        desc: 'چرخش ۳۵۵ درجه افقی، ۹۰ درجه عمودی، شیار MicroSD',
        price: '۱۱۰',
        oldPrice: '۲۲۰',
        discount: '۵۰٪',
        icon: 'fa-wifi',
        image: 'assets/111.jpg',
        category: 'camera',
        bestseller: true,
        discounted: true
    },
    {
        id: 4,
        name: 'دوربین IP67 صنعتی',
        desc: 'درجه صنعتی، مقاومت دمایی -۴۰ تا ۷۰ درجه',
        price: '۱۷۰',
        oldPrice: '۳۱۰',
        discount: '۴۵٪',
        icon: 'fa-shield-alt',
        image: 'assets/images2345.jpg',
        category: 'camera',
        bestseller: false,
        discounted: true
    },
    {
        id: 5,
        name: 'دوربین Smart Doorbell',
        desc: 'کیفیت ۱۰۸۰p، دید رنگی شب، ارتباط دوطرفه صوتی',
        price: '۸۴',
        oldPrice: '۱۲۹',
        discount: '۳۵٪',
        icon: 'fa-microchip',
        image: 'assets/Untitled.jpg',
        category: 'camera',
        bestseller: true,
        discounted: true
    },
    {
        id: 6,
        name: 'دوربین ۳۶۰ درجه پانوراما',
        desc: 'دید کامل بدون نقطه کور، اتصال به تلفن همراه',
        price: '۱۹۹',
        oldPrice: '۲۸۹',
        discount: '۳۳٪',
        icon: 'fa-sync-alt',
        image: 'assets/images.jpg',
        category: 'camera',
        bestseller: true,
        discounted: true
    },
    {
        id: 7,
        name: 'دوربین مخفی مینیاتوری',
        desc: 'ابعاد کوچک، مناسب فضای داخلی و اداری',
        price: '۶۵',
        oldPrice: '۹۹',
        discount: '۳۴٪',
        icon: 'fa-mask',
        image: 'assets/111.jpg',
        category: 'camera',
        bestseller: false,
        discounted: true
    },
    {
        id: 8,
        name: 'دوربین Bullet 8K',
        desc: 'کیفیت فوق‌العاده ۸K، لنز واید حرفه‌ای',
        price: '۲۹۹',
        oldPrice: '۴۹۹',
        discount: '۴۰٪',
        icon: 'fa-camera',
        image: 'assets/images2345.jpg',
        category: 'camera',
        bestseller: false,
        discounted: true
    },

    // ===== NVR / DVR =====
    {
        id: 9,
        name: 'دستگاه NVR ۸ کاناله',
        desc: 'ضبط ۸ کاناله، پشتیبانی از هارد ۱۰TB، خروجی ۴K',
        price: '۲۴۹',
        oldPrice: '۳۱۹',
        discount: '۲۲٪',
        icon: 'fa-server',
        image: 'assets/35678.jpg',
        category: 'nvr',
        bestseller: true,
        discounted: true
    },
    {
        id: 10,
        name: 'دستگاه NVR ۱۶ کاناله',
        desc: 'ضبط ۱۶ کاناله، مناسب پروژه‌های بزرگ و صنعتی',
        price: '۳۷۴',
        oldPrice: '۴۹۹',
        discount: '۲۵٪',
        icon: 'fa-server',
        image: 'assets/35678.jpg',
        category: 'nvr',
        bestseller: true,
        discounted: true
    },
    {
        id: 11,
        name: 'دستگاه DVR ۴ کاناله',
        desc: 'ضبط ۴ کاناله، خروجی VGA + HDMI',
        price: '۱۴۹',
        oldPrice: '۱۹۹',
        discount: '۲۵٪',
        icon: 'fa-hdd',
        image: 'assets/35678.jpg',
        category: 'nvr',
        bestseller: false,
        discounted: true
    },
    {
        id: 12,
        name: 'دستگاه DVR ۸ کاناله',
        desc: 'پشتیبانی از دوربین آنالوگ و AHD، خروجی همزمان',
        price: '۱۹۹',
        oldPrice: '۲۵۹',
        discount: '۲۳٪',
        icon: 'fa-hdd',
        image: 'assets/35678.jpg',
        category: 'nvr',
        bestseller: false,
        discounted: true
    },

    // ===== پکیج‌های کامل =====
    {
        id: 13,
        name: 'پکیج ۴ دوربین + NVR ۸ کاناله',
        desc: '۴ دوربین بولت ۴K + NVR ۸ کاناله + هارد ۲TB',
        price: '۵۹۹',
        oldPrice: '۷۹۹',
        discount: '۲۵٪',
        icon: 'fa-box',
        image: 'assets/234.jpg',
        category: 'package',
        bestseller: true,
        discounted: true
    },
    {
        id: 14,
        name: 'پکیج ۸ دوربین + NVR ۱۶ کاناله',
        desc: '۸ دوربین دام ۵MP + NVR ۱۶ کاناله + هارد ۴TB',
        price: '۹۹۹',
        oldPrice: '۱۳۹۹',
        discount: '۲۸٪',
        icon: 'fa-cubes',
        image: 'assets/46789.jpg',
        category: 'package',
        bestseller: false,
        discounted: true
    },
    {
        id: 15,
        name: 'پکیج اقتصادی ۲ دوربین + DVR',
        desc: '۲ دوربین آنالوگ + DVR ۴ کاناله + هارد ۱TB',
        price: '۲۹۹',
        oldPrice: '۳۹۹',
        discount: '۲۵٪',
        icon: 'fa-box-open',
        image: 'assets/34566.jpg',
        category: 'package',
        bestseller: false,
        discounted: true
    },
    {
        id: 16,
        name: 'پکیج حرفه‌ای ۶ دوربین + NVR',
        desc: '۶ دوربین PTZ وایرلس + NVR ۱۶ کاناله + هارد ۶TB',
        price: '۷۹۹',
        oldPrice: '۱۰۹۹',
        discount: '۲۷٪',
        icon: 'fa-crown',
        image: 'assets/234.jpg',
        category: 'package',
        bestseller: true,
        discounted: true
    },

    // ===== تجهیزات جانبی =====
    {
        id: 17,
        name: 'کابل سیامی ۳۰ متری',
        desc: 'کابل ترکیبی برق + تصویر برای نصب حرفه‌ای',
        price: '۴۹',
        oldPrice: '۶۹',
        discount: '۲۹٪',
        icon: 'fa-plug',
        image: 'assets/images2345.jpg',
        category: 'accessory',
        bestseller: true,
        discounted: true
    },
    {
        id: 18,
        name: 'براکت و اتصالات کامل',
        desc: 'مجموعه براکت دیواری + پیچ و مهره + آداپتور',
        price: '۳۹',
        oldPrice: '۵۹',
        discount: '۳۴٪',
        icon: 'fa-tools',
        image: 'assets/111.jpg',
        category: 'accessory',
        bestseller: false,
        discounted: true
    },
    {
        id: 19,
        name: 'آداپتور برق ۱۲ ولت ۵ آمپر',
        desc: 'مناسب تغذیه همزمان چند دوربین مداربسته',
        price: '۱۹',
        oldPrice: '۲۹',
        discount: '۳۴٪',
        icon: 'fa-bolt',
        image: 'assets/Untitled.jpg',
        category: 'accessory',
        bestseller: false,
        discounted: true
    },
    {
        id: 20,
        name: 'هارد دیسک نظارتی ۲TB',
        desc: 'مخصوص ضبط ۲۴ ساعته دوربین مداربسته',
        price: '۸۹',
        oldPrice: '۱۱۹',
        discount: '۲۵٪',
        icon: 'fa-database',
        image: 'assets/images.jpg',
        category: 'accessory',
        bestseller: true,
        discounted: true
    }

];


// خروجی برای Node.js (اسکریپت seed سرور) - در مرورگر بی‌اثر است
if (typeof module !== 'undefined' && module.exports) {
    module.exports = defaultCatalogProducts;
}
