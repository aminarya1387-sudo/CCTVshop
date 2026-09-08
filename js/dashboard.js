// ============================================================
// AMIN SYSTEM - ADMIN DASHBOARD
// ============================================================

(async function init() {

    const session = await renderAdminSidebar('dashboard');

    if (!session) return;

    document.getElementById('welcomeTitle').innerText =
        `سلام ${session.displayName} 👋`;

    // ===== پیام دسترسی نداشتن (اگر از یک لینک محدود ریدایرکت شده باشد) =====
    if (new URLSearchParams(location.search).get('denied') === '1') {

        const notice = document.createElement('div');
        notice.className = 'dash-hint';
        notice.style.marginBottom = '20px';
        notice.style.background = 'rgba(230,62,62,0.08)';
        notice.style.borderColor = 'rgba(230,62,62,0.2)';
        notice.style.color = '#b02a2a';

        notice.innerHTML = `
            <i class="fas fa-lock" style="color:#e63e3e;"></i>
            <div>شما به آن بخش دسترسی ندارید. با نقش «${roleLabels[session.role] || session.role}» فقط به موارد نشان‌داده‌شده در سایدبار دسترسی دارید.</div>
        `;

        document.querySelector('.admin-main').insertBefore(
            notice,
            document.getElementById('statGrid')
        );

        history.replaceState(null, '', 'dashboard.html');

    }

    const perms = rolePermissions[session.role] || [];
    const statGrid = document.getElementById('statGrid');

    const cards = [];

    if (perms.includes('products')) {

        const products = await ProductStore.getAll();
        const counts = await ProductStore.getCategoryCounts();

        cards.push(`
            <div class="stat-card c1">
                <div class="stat-icon"><i class="fas fa-camera-retro"></i></div>
                <div>
                    <div class="stat-value">${products.length}</div>
                    <div class="stat-label">تعداد کل محصولات</div>
                </div>
            </div>
        `);

        cards.push(`
            <div class="stat-card c2">
                <div class="stat-icon"><i class="fas fa-th-large"></i></div>
                <div>
                    <div class="stat-value">${counts.camera + counts.nvr + counts.package + counts.accessory}</div>
                    <div class="stat-label">دوربین ${counts.camera} / NVR ${counts.nvr} / پکیج ${counts.package} / جانبی ${counts.accessory}</div>
                </div>
            </div>
        `);

    }

    if (perms.includes('orders')) {

        const orders = await OrderStore.getAll();
        const pending = orders.filter(o => o.status === 'pending').length;

        cards.push(`
            <div class="stat-card c3">
                <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                <div>
                    <div class="stat-value">${orders.length}</div>
                    <div class="stat-label">تعداد کل سفارش‌ها</div>
                </div>
            </div>
        `);

        cards.push(`
            <div class="stat-card c4">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div>
                    <div class="stat-value">${pending}</div>
                    <div class="stat-label">سفارش در انتظار بررسی</div>
                </div>
            </div>
        `);

    }

    statGrid.innerHTML = cards.join('');

})();
