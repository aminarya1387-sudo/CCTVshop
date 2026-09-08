// ============================================================
// AMIN SYSTEM - ADMIN AUTH
// حالا لاگین و نشست واقعاً روی سرور چک می‌شود (نه مرورگر). از
// data/admin-users.js فقط متادیتای نمایشی (عنوان بخش‌ها، دسترسی
// هر نقش) استفاده می‌شود؛ پسورد دیگر سمت کلاینت نیست.
// ============================================================

const AdminAuth = {

    API: '/api/auth',

    // ===== ورود =====
    async login(username, password) {

        const res = await fetch(`${this.API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) return null;

        return res.json();

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

    },

    // ===== خروج =====
    async logout() {

        await fetch(`${this.API}/logout`, { method: 'POST' });

    },

    // ===== آیا این نقش به این بخش دسترسی دارد؟ =====
    async hasAccess(sectionKey) {

        const session = await this.getSession();

        if (!session) return false;

        const perms = rolePermissions[session.role] || [];

        return perms.includes(sectionKey);

    },

    // ===== نگهبان صفحه: در بالای هر صفحه محافظت‌شده صدا زده می‌شود =====
    async guard(sectionKey) {

        const session = await this.getSession();

        if (!session) {
            location.href = 'login.html';
            return null;
        }

        const perms = rolePermissions[session.role] || [];

        if (!perms.includes(sectionKey)) {

            const firstAllowed = adminSections.find(
                s => perms.includes(s.key)
            );

            location.href = firstAllowed
                ? `${firstAllowed.href}?denied=1`
                : 'login.html';

            return null;

        }

        return session;

    }

};


// ===== ساخت سایدبار پنل مدیریت (فراخوانی در بالای هر صفحه، با await) =====
async function renderAdminSidebar(activeKey) {

    const session = await AdminAuth.guard(activeKey);

    if (!session) return null;

    const container = document.getElementById('adminSidebar');

    if (!container) return session;

    const perms = rolePermissions[session.role] || [];

    container.innerHTML = `

        <div class="admin-side-logo">
            <img src="assets/company logo.jpg" alt="Amin System" class="admin-side-logo-img" /> <span class="logo-system">SYSTEM</span> <span class="logo-amin">AMIN</span>
        </div>

        <div class="admin-side-user">
            <div class="admin-side-avatar"><i class="fas fa-user"></i></div>
            <div class="admin-side-user-info">
                <strong>${session.displayName}</strong>
                <span>${roleLabels[session.role] || session.role}</span>
            </div>
        </div>

        <div class="admin-side-section-title">دسترسی‌های شما</div>

        <nav class="admin-side-nav">
            ${adminSections.map(s => {

                const allowed = perms.includes(s.key);
                const isActive = s.key === activeKey;

                if (allowed) {
                    return `
                        <a href="${s.href}" class="admin-side-link ${isActive ? 'active' : ''}">
                            <i class="fas ${s.icon}"></i>
                            <span>${s.title}</span>
                        </a>
                    `;
                }

                return `
                    <span class="admin-side-link locked" title="دسترسی ندارید">
                        <i class="fas ${s.icon}"></i>
                        <span>${s.title}</span>
                        <i class="fas fa-lock lock-icon"></i>
                    </span>
                `;

            }).join('')}
        </nav>

        <button class="admin-side-logout" id="adminLogoutBtn">
            <i class="fas fa-sign-out-alt"></i>
            خروج از پنل
        </button>

        <a href="http://localhost:3000/index.html" class="admin-side-back">
            <i class="fas fa-arrow-right"></i>
            بازگشت به سایت
        </a>

    `;

    document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
        await AdminAuth.logout();
        location.href = 'login.html';
    });

    return session;

}
