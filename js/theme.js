// ============================================================
// AMIN SYSTEM - THEME TOGGLE (روشن/تیره)
// تشخیص اولیه‌ی پوسته (سیستم/localStorage) داخل <head> هر صفحه
// انجام می‌شود (برای جلوگیری از پرش رنگ)؛ این فایل فقط دکمه‌ی
// تعویض پوسته را فعال می‌کند.
// ============================================================

function initThemeToggle() {

    const btn = document.getElementById('themeToggle');

    if (!btn) return;

    btn.addEventListener('click', function () {

        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);

        try {
            localStorage.setItem('theme', next);
        } catch (e) {
            // ذخیره‌سازی ممکن نیست (مثلاً حالت خصوصی مرورگر) - مشکلی نیست
        }

    });

}


initThemeToggle();
