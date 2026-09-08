// ============================================================
// AMIN SYSTEM - CATEGORIES DATA
// (متادیتای ظاهری دسته‌ها؛ تعداد واقعی هر دسته در زمان اجرا
//  از ProductStore.getCategoryCounts() خوانده می‌شود)
// ============================================================

const categories = [
    {
        categoryKey: 'camera',
        name: 'دوربین‌ها',
        icon: 'fa-camera-retro',
        bgColor: 'rgba(15,42,90,0.06)',
        color: '#0f2a5a',
        link: 'pages/products.html?cat=camera'
    },
    {
        categoryKey: 'nvr',
        name: 'NVR / DVR',
        icon: 'fa-server',
        bgColor: 'rgba(26,74,138,0.06)',
        color: '#1a4a8a',
        link: 'pages/products.html?cat=nvr'
    },
    {
        categoryKey: 'package',
        name: 'پکیج‌های کامل',
        icon: 'fa-box',
        bgColor: 'rgba(212,168,32,0.08)',
        color: '#d4a820',
        link: 'pages/products.html?cat=package'
    },
    {
        categoryKey: 'accessory',
        name: 'تجهیزات جانبی',
        icon: 'fa-tools',
        bgColor: 'rgba(42,157,143,0.06)',
        color: '#2a9d8f',
        link: 'pages/products.html?cat=accessory'
    }
];
