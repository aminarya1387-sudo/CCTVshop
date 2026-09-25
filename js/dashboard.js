// ============================================================
// AMIN SYSTEM - ADMIN DASHBOARD (هوشمند)
// شاخص‌های کلیدی با مقایسه‌ی هفتگی، نمودار فروش، وضعیت سفارش‌ها،
// پرفروش‌ترین‌های واقعی (از روی سفارش‌ها)، موجودی رو به اتمام و
// «دستیار هوشمند» که مشکلات و فرصت‌ها را پیدا و پیشنهاد می‌دهد.
// ============================================================

const DAY = 86400000;
const LOW_STOCK = 5;

// createdAt دیتابیس به وقت UTC و بدون منطقه‌ی زمانی است ("2026-09-25 10:00:00")
function orderTime(o) {
    const raw = String(o.createdAt || '');
    const t = Date.parse(raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z');
    return Number.isNaN(t) ? 0 : t;
}

const money = n => `${Math.round(n).toLocaleString('fa-IR')} تومان`;
const num = n => Math.round(n).toLocaleString('fa-IR');


(async function init() {

    const session = await renderAdminSidebar('dashboard');

    if (!session) return;

    greet(session);
    showDeniedNotice(session);

    const perms = rolePermissions[session.role] || [];
    const canProducts = perms.includes('products');
    const canOrders = perms.includes('orders');
    const canBanners = perms.includes('banners');

    const [products, orders, banners] = await Promise.all([
        canProducts ? AdminSmart.products() : [],
        canOrders ? AdminSmart.orders() : [],
        canBanners ? fetch('/api/banners/all').then(r => (r.ok ? r.json() : [])).catch(() => []) : []
    ]);

    renderStats({ products, orders, banners, canProducts, canOrders, canBanners });

    if (canOrders) {
        renderSalesChart(orders);
        renderStatusDonut(orders);
        renderTopProducts(orders);
    }

    if (canProducts) {
        renderLowStock(products);
    }

    renderInsights({ products, orders, banners, canProducts, canOrders, canBanners });

})();


// ============================================================
// خوش‌آمد بر اساس ساعت روز
// ============================================================

function greet(session) {

    const h = new Date().getHours();
    const part = h < 5 ? 'شب بخیر' : h < 12 ? 'صبح بخیر' : h < 17 ? 'ظهر بخیر' : h < 21 ? 'عصر بخیر' : 'شب بخیر';

    document.getElementById('welcomeTitle').textContent = `${part}، ${session.displayName} 👋`;

    document.getElementById('welcomeSub').textContent = new Date().toLocaleDateString('fa-IR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) + ' — نگاه کلی و هوشمند به وضعیت فروشگاه';

}

function showDeniedNotice(session) {

    if (new URLSearchParams(location.search).get('denied') !== '1') return;

    const notice = document.createElement('div');
    notice.className = 'dash-denied';
    notice.innerHTML = `
        <i class="fas fa-lock"></i>
        <div>شما به آن بخش دسترسی ندارید. با نقش «${escapeHTML(roleLabels[session.role] || session.role)}» فقط به موارد نشان‌داده‌شده در سایدبار دسترسی دارید.</div>
    `;

    document.querySelector('.admin-main').insertBefore(notice, document.getElementById('statGrid'));

    history.replaceState(null, '', 'dashboard.html');

}


// ============================================================
// کارت‌های شاخص (با شمارش متحرک و مقایسه با ۷ روز قبل)
// ============================================================

function trend(current, previous) {

    if (!previous && !current) return '';
    if (!previous) return '<span class="stat-trend up"><i class="fas fa-arrow-trend-up"></i> جدید</span>';

    const pct = Math.round(((current - previous) / previous) * 100);
    const cls = pct >= 0 ? 'up' : 'down';

    return `<span class="stat-trend ${cls}"><i class="fas fa-arrow-trend-${cls}"></i> ${toFaDigits(Math.abs(pct))}٪</span>`;

}

function renderStats({ products, orders, banners, canProducts, canOrders, canBanners }) {

    const cards = [];
    const now = Date.now();

    if (canOrders) {

        const valid = orders.filter(o => o.status !== 'cancelled');
        const inRange = (o, from, to) => orderTime(o) >= now - from && orderTime(o) < now - to;

        const revenue = valid.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const rev7 = valid.filter(o => inRange(o, 7 * DAY, 0)).reduce((s, o) => s + (o.totalPrice || 0), 0);
        const revPrev7 = valid.filter(o => inRange(o, 14 * DAY, 7 * DAY)).reduce((s, o) => s + (o.totalPrice || 0), 0);

        const ord7 = orders.filter(o => inRange(o, 7 * DAY, 0)).length;
        const ordPrev7 = orders.filter(o => inRange(o, 14 * DAY, 7 * DAY)).length;

        const pending = orders.filter(o => o.status === 'pending').length;

        cards.push({ cls: 'c1', icon: 'fa-sack-dollar', value: revenue, format: money, label: 'درآمد کل (بدون لغوشده‌ها)', extra: trend(rev7, revPrev7) });
        cards.push({ cls: 'c3', icon: 'fa-receipt', value: orders.length, format: num, label: 'تعداد کل سفارش‌ها', extra: trend(ord7, ordPrev7) });
        cards.push({ cls: 'c5', icon: 'fa-scale-balanced', value: valid.length ? revenue / valid.length : 0, format: money, label: 'میانگین هر سفارش' });
        cards.push({ cls: 'c4', icon: 'fa-clock', value: pending, format: num, label: 'در انتظار بررسی', href: 'orders.html?status=pending' });

    }

    if (canProducts) {

        const low = products.filter(p => Number(p.stock) <= LOW_STOCK).length;

        cards.push({ cls: 'c2', icon: 'fa-camera-retro', value: products.length, format: num, label: 'محصولات فروشگاه', href: 'admin.html' });
        cards.push({ cls: 'c6', icon: 'fa-triangle-exclamation', value: low, format: num, label: 'موجودی کم یا تمام‌شده', href: 'admin.html?filter=lowstock' });

    }

    if (canBanners) {

        const views = banners.reduce((s, b) => s + b.views, 0);
        const clicks = banners.reduce((s, b) => s + b.clicks, 0);

        cards.push({ cls: 'c7', icon: 'fa-images', value: banners.filter(b => b.active).length, format: num, label: 'بنر فعال اسلایدر', href: 'banners.html' });
        cards.push({ cls: 'c8', icon: 'fa-hand-pointer', value: views ? (clicks / views) * 100 : 0, format: v => `${toFaDigits(v.toFixed(1))}٪`, label: `نرخ کلیک بنرها (${num(clicks)} کلیک)` });

    }

    const grid = document.getElementById('statGrid');

    grid.innerHTML = cards.map((c, i) => `
        <${c.href ? `a href="${c.href}"` : 'div'} class="stat-card ${c.cls}" style="--i:${i}">
            <div class="stat-icon"><i class="fas ${c.icon}"></i></div>
            <div class="stat-body">
                <div class="stat-value" data-index="${i}">${c.format(0)}</div>
                <div class="stat-label">${c.label}</div>
                ${c.extra || ''}
            </div>
        </${c.href ? 'a' : 'div'}>
    `).join('');

    // شمارش متحرک از صفر تا مقدار واقعی
    const start = performance.now();
    const duration = 1100;

    (function frame(t) {
        const p = Math.min(1, (t - start) / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        grid.querySelectorAll('.stat-value').forEach(el => {
            const c = cards[el.dataset.index];
            el.textContent = c.format(c.value * ease);
        });
        if (p < 1) requestAnimationFrame(frame);
    })(start);

}


// ============================================================
// نمودار فروش ۱۴ روز اخیر (SVG)
// ============================================================

function renderSalesChart(orders) {

    document.getElementById('salesCard').hidden = false;

    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = Array.from({ length: days }, (_, i) => {
        const from = today.getTime() - (days - 1 - i) * DAY;
        return { from, to: from + DAY, revenue: 0, count: 0 };
    });

    orders.filter(o => o.status !== 'cancelled').forEach(o => {
        const t = orderTime(o);
        const b = buckets.find(b => t >= b.from && t < b.to);
        if (b) {
            b.revenue += o.totalPrice || 0;
            b.count++;
        }
    });

    const total = buckets.reduce((s, b) => s + b.revenue, 0);
    document.getElementById('salesTotal').textContent = money(total);

    const W = 640, H = 220, P = 28;
    const max = Math.max(1, ...buckets.map(b => b.revenue));

    // محور زمان راست‌به‌چپ: امروز سمت چپ
    const x = i => W - P - (i * (W - 2 * P)) / (days - 1);
    const y = v => H - P - (v / max) * (H - 2 * P);

    const pts = buckets.map((b, i) => [x(i), y(b.revenue)]);

    // منحنی نرم (Catmull-Rom → Bezier)
    const line = pts.reduce((d, p, i, a) => {
        if (i === 0) return `M${p[0]},${p[1]}`;
        const p0 = a[i - 2] || a[i - 1];
        const p1 = a[i - 1];
        const p3 = a[i + 1] || p;
        const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
        const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
        return `${d} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`;
    }, '');

    const area = `${line} L${pts[pts.length - 1][0]},${H - P} L${pts[0][0]},${H - P} Z`;

    const grid = [0.25, 0.5, 0.75, 1].map(f => `
        <line x1="${P}" x2="${W - P}" y1="${y(max * f)}" y2="${y(max * f)}" class="dc-grid" />
    `).join('');

    const labels = buckets.map((b, i) => (i % 2 === (days - 1) % 2 ? `
        <text x="${x(i)}" y="${H - 6}" class="dc-label">${new Date(b.from).toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' })}</text>
    ` : '')).join('');

    const dots = buckets.map((b, i) => `
        <g class="dc-point">
            <rect x="${x(i) - (W - 2 * P) / (days - 1) / 2}" y="${P}" width="${(W - 2 * P) / (days - 1)}" height="${H - 2 * P}" fill="transparent" />
            <circle cx="${x(i)}" cy="${y(b.revenue)}" r="4" />
            <title>${new Date(b.from).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}\n${money(b.revenue)} — ${num(b.count)} سفارش</title>
        </g>
    `).join('');

    document.getElementById('salesChart').innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="نمودار فروش ۱۴ روز اخیر">
            <defs>
                <linearGradient id="dcArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#22d3ee" stop-opacity=".45" />
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="dcLine" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stop-color="#22d3ee" />
                    <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
            </defs>
            ${grid}
            <path d="${area}" fill="url(#dcArea)" class="dc-area" />
            <path d="${line}" fill="none" stroke="url(#dcLine)" stroke-width="3" stroke-linecap="round" class="dc-line" />
            ${labels}
            ${dots}
        </svg>
        ${total === 0 ? '<div class="dash-empty-overlay">در ۱۴ روز اخیر فروشی ثبت نشده</div>' : ''}
    `;

}


// ============================================================
// نمودار دونات وضعیت سفارش‌ها
// ============================================================

function renderStatusDonut(orders) {

    document.getElementById('statusCard').hidden = false;

    const statuses = [
        { key: 'pending', label: 'در انتظار', color: '#fbbf24' },
        { key: 'confirmed', label: 'تأییدشده', color: '#818cf8' },
        { key: 'shipped', label: 'ارسال‌شده', color: '#34d399' },
        { key: 'cancelled', label: 'لغوشده', color: '#f87171' }
    ].map(s => ({ ...s, count: orders.filter(o => o.status === s.key).length }));

    const total = orders.length;

    let acc = 0;
    const stops = statuses.map(s => {
        const from = acc;
        acc += total ? (s.count / total) * 360 : 0;
        return `${s.color} ${from}deg ${acc}deg`;
    }).join(', ');

    document.getElementById('statusDonut').innerHTML = `
        <div class="dash-donut" style="background:${total ? `conic-gradient(${stops})` : 'rgba(255,255,255,.08)'}">
            <div><strong>${num(total)}</strong><span>سفارش</span></div>
        </div>
        <ul class="dash-legend">
            ${statuses.map(s => `
                <li>
                    <a href="orders.html?status=${s.key}">
                        <i style="background:${s.color};box-shadow:0 0 10px ${s.color}"></i>
                        ${s.label}
                        <b>${num(s.count)}</b>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;

}


// ============================================================
// پرفروش‌ترین‌ها بر اساس سفارش‌های واقعی
// ============================================================

function renderTopProducts(orders) {

    document.getElementById('topCard').hidden = false;

    const sold = {};

    orders.filter(o => o.status !== 'cancelled').forEach(o => {
        o.items.forEach(item => {
            const key = item.id || item.name;
            sold[key] = sold[key] || { ...item, qty: 0 };
            sold[key].qty += Number(item.quantity) || 0;
        });
    });

    const top = Object.values(sold).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const max = top.length ? top[0].qty : 1;

    document.getElementById('topProducts').innerHTML = top.length
        ? top.map((p, i) => `
            <div class="dash-top-row">
                <span class="dash-rank r${i + 1}">${toFaDigits(i + 1)}</span>
                <div class="dash-top-img">${productMedia(p)}</div>
                <div class="dash-top-info">
                    <div class="dash-top-name">${escapeHTML(p.name)}</div>
                    <div class="dash-bar"><span style="--w:${(p.qty / max) * 100}%"></span></div>
                </div>
                <b>${num(p.qty)} عدد</b>
            </div>
        `).join('')
        : '<div class="dash-empty">هنوز سفارشی ثبت نشده</div>';

}


// ============================================================
// موجودی رو به اتمام + شارژ سریع انبار
// ============================================================

function renderLowStock(products) {

    const card = document.getElementById('stockCard');
    card.hidden = false;

    const low = products
        .filter(p => Number(p.stock) <= LOW_STOCK)
        .sort((a, b) => a.stock - b.stock);

    const box = document.getElementById('lowStock');

    box.innerHTML = low.length
        ? low.slice(0, 8).map(p => `
            <div class="dash-stock-row" data-id="${p.id}">
                <div class="dash-top-img">${productMedia(p)}</div>
                <div class="dash-top-info">
                    <div class="dash-top-name">${escapeHTML(p.name)}</div>
                    <span class="stock-badge ${p.stock <= 0 ? 'out' : 'low'}">${p.stock <= 0 ? 'ناموجود' : `${toFaDigits(p.stock)} عدد باقی مانده`}</span>
                </div>
                <button type="button" class="cg-chip-btn" data-restock="10" title="۱۰ عدد به موجودی اضافه کن">
                    <i class="fas fa-plus"></i> ۱۰ عدد
                </button>
            </div>
        `).join('')
        : '<div class="dash-empty ok"><i class="fas fa-circle-check"></i> موجودی همه‌ی محصولات کافی است</div>';

    box.onclick = async e => {

        const btn = e.target.closest('[data-restock]');
        if (!btn) return;

        const row = btn.closest('.dash-stock-row');
        const product = products.find(p => p.id === Number(row.dataset.id));

        btn.disabled = true;

        try {
            const updated = await ProductStore.update(product.id, { stock: Math.max(0, Number(product.stock)) + Number(btn.dataset.restock) });
            product.stock = updated.stock;
            renderLowStock(products);
        } catch (err) {
            alert(err.message);
            btn.disabled = false;
        }

    };

}


// ============================================================
// دستیار هوشمند: پیدا کردن مشکلات و فرصت‌ها
// ============================================================

function renderInsights({ products, orders, banners, canProducts, canOrders, canBanners }) {

    const insights = [];
    const now = Date.now();
    const add = (level, icon, text, href, action) => insights.push({ level, icon, text, href, action });

    if (canOrders) {

        const stale = orders.filter(o => o.status === 'pending' && now - orderTime(o) > DAY);
        if (stale.length) add('danger', 'fa-hourglass-half', `${num(stale.length)} سفارش بیش از ۲۴ ساعت است در انتظار مانده؛ مشتری منتظر است!`, 'orders.html?status=pending', 'بررسی');

        const confirmedOld = orders.filter(o => o.status === 'confirmed' && now - orderTime(o) > 3 * DAY);
        if (confirmedOld.length) add('warn', 'fa-truck', `${num(confirmedOld.length)} سفارش تأییدشده بیش از ۳ روز است ارسال نشده.`, 'orders.html?status=confirmed', 'مشاهده');

        const valid = orders.filter(o => o.status !== 'cancelled');
        const cancelRate = orders.length >= 5 ? (orders.length - valid.length) / orders.length : 0;
        if (cancelRate > 0.2) add('warn', 'fa-ban', `نرخ لغو سفارش ${toFaDigits(Math.round(cancelRate * 100))}٪ است؛ دلیلش را بررسی کن.`, 'orders.html?status=cancelled', 'بررسی');

        // مشتری وفادار
        const byPhone = {};
        valid.forEach(o => { byPhone[o.customer.phone] = (byPhone[o.customer.phone] || { name: o.customer.name, n: 0 }); byPhone[o.customer.phone].n++; });
        const loyal = Object.values(byPhone).filter(c => c.n >= 3);
        if (loyal.length) add('good', 'fa-heart', `${escapeHTML(loyal[0].name)}${loyal.length > 1 ? ` و ${num(loyal.length - 1)} مشتری دیگر` : ''} بیش از ۳ بار خرید کرده‌اند؛ یک کد تخفیف وفاداری پیشنهاد خوبی است.`);

    }

    if (canProducts) {

        // محصولات پرفروش (از سفارش‌ها یا فلگ پرفروش) که تمام شده‌اند
        const soldIds = new Set(orders.flatMap(o => o.items.map(i => i.id)));
        const outHot = products.filter(p => p.stock <= 0 && (p.bestseller || soldIds.has(p.id)));
        if (outHot.length) add('danger', 'fa-fire', `«${escapeHTML(outHot[0].name)}»${outHot.length > 1 ? ` و ${num(outHot.length - 1)} محصول پرفروش دیگر` : ''} تمام شده؛ فروش را از دست می‌دهی.`, 'admin.html?filter=lowstock', 'شارژ انبار');

        const noImage = products.filter(p => !p.image);
        if (noImage.length) add('warn', 'fa-image', `${num(noImage.length)} محصول عکس ندارد؛ محصولات با عکس تا چند برابر بیشتر فروش می‌روند.`, 'admin.html?filter=noimage', 'افزودن عکس');

        const badDiscount = products.filter(p => p.discount && !p.oldPrice);
        if (badDiscount.length) add('warn', 'fa-percent', `${num(badDiscount.length)} محصول تخفیف دارد ولی «قیمت قبلی» ندارد؛ مشتری میزان تخفیف را نمی‌بیند.`, `admin.html?edit=${badDiscount[0].id}`, 'اصلاح');

        const shortDesc = products.filter(p => (p.desc || '').length < 15);
        if (shortDesc.length) add('info', 'fa-align-right', `توضیحات ${num(shortDesc.length)} محصول خیلی کوتاه است؛ با دکمه‌ی «نوشتن خودکار» در فرم محصول کاملش کن.`, `admin.html?edit=${shortDesc[0].id}`, 'ویرایش');

        if (canOrders && orders.length) {
            const notSelling = products.filter(p => !soldIds.has(p.id) && !p.discounted);
            if (notSelling.length >= 3) add('info', 'fa-lightbulb', `${num(notSelling.length)} محصول تا حالا هیچ فروشی نداشته‌اند؛ یک تخفیف یا بنر ویژه برایشان امتحان کن.`, 'banners.html#new', 'ساخت بنر');
        }

    }

    if (canBanners) {

        const live = banners.filter(b => b.active && (!b.startsAt || Date.parse(b.startsAt) <= now) && (!b.endsAt || Date.parse(b.endsAt) >= now));

        if (!live.length) add('danger', 'fa-images', 'هیچ بنری در صفحه اصلی نمایش داده نمی‌شود!', 'banners.html#new', 'ساخت بنر');
        else if (live.length === 1) add('info', 'fa-images', 'فقط یک بنر فعال است؛ با ۲ تا ۴ بنر، اسلایدر جذاب‌تر می‌شود.', 'banners.html#new', 'افزودن بنر');

        const expired = banners.filter(b => b.active && b.endsAt && Date.parse(b.endsAt) < now);
        if (expired.length) add('info', 'fa-hourglass-end', `${num(expired.length)} بنر زمانش تمام شده؛ تمدیدش کن یا خاموشش کن.`, 'banners.html', 'مدیریت');

        const deadCountdown = banners.filter(b => b.active && b.countdownEnd && Date.parse(b.countdownEnd) < now);
        if (deadCountdown.length) add('info', 'fa-stopwatch', `شمارش معکوس ${num(deadCountdown.length)} بنر به صفر رسیده است.`, 'banners.html', 'بروزرسانی');

        const lowCtr = banners.filter(b => b.active && b.views >= 50 && b.ctr < 1);
        if (lowCtr.length) add('warn', 'fa-chart-line', `بنر «${escapeHTML(lowCtr[0].title)} ${escapeHTML(lowCtr[0].highlight || '')}» با ${num(lowCtr[0].views)} نمایش، کمتر از ۱٪ کلیک گرفته؛ متن یا عکسش را عوض کن.`, 'banners.html', 'ویرایش');

        const best = banners.filter(b => b.views >= 30).sort((a, b) => b.ctr - a.ctr)[0];
        if (best && best.ctr >= 3) add('good', 'fa-trophy', `بنر «${escapeHTML(best.title)} ${escapeHTML(best.highlight || '')}» با CTR ${toFaDigits(best.ctr)}٪ بهترین عملکرد را دارد؛ آن را اولین اسلاید کن.`, 'banners.html', 'مرتب‌سازی');

    }

    const order = { danger: 0, warn: 1, info: 2, good: 3 };
    insights.sort((a, b) => order[a.level] - order[b.level]);

    const count = insights.filter(i => i.level === 'danger' || i.level === 'warn').length;
    document.getElementById('insightCount').textContent = count ? `${toFaDigits(count)} مورد نیاز به توجه` : 'همه‌چیز عالی';

    document.getElementById('insightList').innerHTML = insights.length
        ? insights.map((i, n) => `
            <div class="dash-insight ${i.level}" style="--i:${n}">
                <i class="fas ${i.icon}"></i>
                <p>${i.text}</p>
                ${i.href ? `<a href="${i.href}">${i.action} <i class="fas fa-arrow-left"></i></a>` : ''}
            </div>
        `).join('')
        : '<div class="dash-empty ok"><i class="fas fa-circle-check"></i> مشکلی پیدا نشد؛ فروشگاه در بهترین حالت است!</div>';

}
