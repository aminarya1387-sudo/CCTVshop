// ============================================================
// AMIN SYSTEM - CUSTOMER AUTH (حساب کاربری مشتری‌ها)
// جدا از AdminAuth (js/auth.js) که مخصوص پنل مدیریت است.
// ============================================================

const CustomerAuth = {

    API: '/api/customers',

    // ===== ثبت‌نام =====
    async register(name, phone, password) {

        const res = await fetch(`${this.API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'ثبت‌نام با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== ورود =====
    async login(phone, password) {

        const res = await fetch(`${this.API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'ورود با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== خروج =====
    async logout() {

        await fetch(`${this.API}/logout`, { method: 'POST' });

    },

    // ===== خواندن نشست فعلی از سرور =====
    async getSession() {

        try {

            const res = await fetch(`${this.API}/me`);

            if (!res.ok) return null;

            return res.json();

        } catch (e) {

            return null;

        }

    }

};


// ===== مسیر پایه‌ی صفحات بسته به عمق صفحه فعلی =====
function accountPagesBase() {
    return location.pathname.includes('/pages/') ? '' : 'pages/';
}


// ===== رندر آیکون/دراپ‌داون حساب کاربری در ناوبار (در همه صفحات عمومی) =====
async function initAccountWidget() {

    const dropdown = document.getElementById('accountDropdown');
    const icon = document.querySelector('#accountWrapper .account-icon i');

    if (!dropdown) return null;

    const session = await CustomerAuth.getSession();
    const base = accountPagesBase();

    if (session) {

        if (icon) icon.className = 'fas fa-user-check';

        dropdown.innerHTML = `
            <div class="account-dropdown-header">
                <i class="fas fa-circle-user"></i>
                <div>
                    <strong>${session.name}</strong>
                    <span>${session.phone}</span>
                </div>
            </div>
            <a href="${base}my-orders.html" class="account-dropdown-link">
                <i class="fas fa-receipt"></i> سفارش‌های من
            </a>
            <button type="button" class="account-dropdown-link account-logout-btn" id="accountLogoutBtn">
                <i class="fas fa-sign-out-alt"></i> خروج از حساب
            </button>
        `;

        const logoutBtn = document.getElementById('accountLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await CustomerAuth.logout();
                location.reload();
            });
        }

    } else {

        if (icon) icon.className = 'fas fa-user';

        dropdown.innerHTML = `
            <div class="account-dropdown-guest">
                <i class="fas fa-user-lock"></i>
                <p>برای ثبت سفارش و دیدن تاریخچه، وارد حساب کاربری‌تان شوید</p>
                <a href="${base}account.html" class="account-dropdown-cta">
                    ورود / ثبت‌نام
                </a>
            </div>
        `;

    }

    return session;

}


initAccountWidget();
