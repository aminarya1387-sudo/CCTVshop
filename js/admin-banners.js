// ============================================================
// AMIN SYSTEM - ADMIN PANEL / BANNERS
// مدیریت بنرهای اسلایدر صفحه اصلی: افزودن/ویرایش/حذف، زمان‌بندی،
// مرتب‌سازی با کشیدن، آمار نمایش/کلیک و پیش‌نمایش زنده.
// ============================================================

const BANNER_API = '/api/banners';

const BANNER_THEMES = [
    { key: 'ocean', label: 'اقیانوس', colors: ['#061d47', '#0a65ba'] },
    { key: 'neon', label: 'نئون', colors: ['#2a0a4a', '#6d28d9'] },
    { key: 'sunset', label: 'غروب', colors: ['#5a1024', '#e0452b'] },
    { key: 'emerald', label: 'زمرد', colors: ['#053b2e', '#0e9f6e'] },
    { key: 'royal', label: 'سلطنتی', colors: ['#1b1553', '#b8860b'] },
    { key: 'midnight', label: 'نیمه‌شب', colors: ['#0f172a', '#334155'] }
];

const BANNER_ICONS = [
    'fa-camera-retro', 'fa-video', 'fa-eye', 'fa-shield-halved', 'fa-box-open',
    'fa-server', 'fa-wifi', 'fa-bolt', 'fa-gift', 'fa-percent', 'fa-truck-fast', 'fa-headset'
];

const CATEGORY_LINKS = {
    camera: 'pages/products.html?cat=camera',
    nvr: 'pages/products.html?cat=nvr',
    package: 'pages/products.html?cat=package',
    accessory: 'pages/products.html?cat=accessory'
};

let banners = [];
let catalog = [];
let copyVariant = 0;

const $ = id => document.getElementById(id);


(async function init() {

    const session = await renderAdminSidebar('banners');

    if (!session) return;

    renderThemePicker();
    renderIconPicker();
    bindForm();

    catalog = await ProductStore.getAll();
    fillProductSelect();

    await loadBanners();

    if (location.hash === '#new') startNewBanner();
    window.addEventListener('hashchange', () => {
        if (location.hash === '#new') startNewBanner();
    });

})();


// ============================================================
// API
// ============================================================

async function api(path, options = {}) {

    const res = await fetch(`${BANNER_API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || 'درخواست با خطا مواجه شد');

    return data;

}

async function loadBanners() {
    banners = await api('/all');
    renderList();
    refreshPreview();
}


// ============================================================
// وضعیت بنر (پخش / زمان‌بندی‌شده / تمام‌شده / خاموش)
// ============================================================

function bannerStatus(b) {

    const now = Date.now();

    if (!b.active) return { key: 'off', label: 'خاموش', icon: 'fa-power-off' };
    if (b.startsAt && Date.parse(b.startsAt) > now) return { key: 'scheduled', label: `از ${formatShortDate(b.startsAt)}`, icon: 'fa-clock' };
    if (b.endsAt && Date.parse(b.endsAt) < now) return { key: 'expired', label: 'زمانش تمام شده', icon: 'fa-hourglass-end' };

    return { key: 'live', label: 'در حال نمایش', icon: 'fa-circle' };

}

function formatShortDate(iso) {
    try {
        return new Date(iso).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}


// ============================================================
// لیست بنرها
// ============================================================

function renderList() {

    const list = $('bannerList');

    $('bannerCount').textContent = `${toFaDigits(banners.length)} بنر`;
    $('bannerEmpty').style.display = banners.length ? 'none' : 'block';

    // بهترین بنر بر اساس CTR (فقط وقتی آمار کافی دارد)
    const ranked = banners.filter(b => b.views >= 20).sort((a, b) => b.ctr - a.ctr);
    const bestId = ranked.length > 1 ? ranked[0].id : null;

    const editingId = Number($('bannerId').value) || null;

    list.innerHTML = banners.map((b, i) => {

        const status = bannerStatus(b);
        const theme = BANNER_THEMES.find(t => t.key === b.theme) || BANNER_THEMES[0];

        return `
            <article class="bn-card ${b.id === editingId ? 'editing' : ''}" draggable="true" data-id="${b.id}">

                <div class="bn-handle" title="بکش تا جابه‌جا شود"><i class="fas fa-grip-vertical"></i></div>

                <div class="bn-thumb" style="background:linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})">
                    ${b.image
                        ? `<img src="${escapeHTML(resolveAsset(b.image))}" alt="" />`
                        : `<i class="fas ${escapeHTML(b.icon || 'fa-camera-retro')}"></i>`}
                    <span class="bn-order">${toFaDigits(i + 1)}</span>
                </div>

                <div class="bn-info">
                    <div class="bn-title">
                        ${escapeHTML(b.title)} <span>${escapeHTML(b.highlight || '')}</span>
                        ${b.id === bestId ? '<em class="bn-best"><i class="fas fa-trophy"></i> بهترین عملکرد</em>' : ''}
                    </div>
                    <div class="bn-meta">
                        <span class="bn-status ${status.key}"><i class="fas ${status.icon}"></i> ${status.label}</span>
                        ${b.countdownEnd && Date.parse(b.countdownEnd) > Date.now() ? '<span class="bn-tag"><i class="fas fa-stopwatch"></i> شمارش معکوس</span>' : ''}
                        <span class="bn-tag">${theme.label}</span>
                    </div>
                    <div class="bn-stats">
                        <span title="تعداد نمایش"><i class="fas fa-eye"></i> ${toFaDigits(b.views)}</span>
                        <span title="تعداد کلیک"><i class="fas fa-hand-pointer"></i> ${toFaDigits(b.clicks)}</span>
                        <span class="bn-ctr" title="نرخ کلیک (CTR)">
                            <i class="fas fa-chart-line"></i> ${toFaDigits(b.ctr)}٪
                            <b style="--w:${Math.min(100, b.ctr * 5)}%"></b>
                        </span>
                    </div>
                </div>

                <div class="bn-actions">
                    <label class="bn-switch" title="روشن/خاموش">
                        <input type="checkbox" data-action="toggle" ${b.active ? 'checked' : ''} />
                        <span></span>
                    </label>
                    <div class="bn-action-row">
                        <button type="button" data-action="up" title="بالاتر" ${i === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                        <button type="button" data-action="down" title="پایین‌تر" ${i === banners.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                        <button type="button" data-action="edit" title="ویرایش"><i class="fas fa-pen"></i></button>
                        <button type="button" data-action="duplicate" title="کپی"><i class="fas fa-clone"></i></button>
                        <button type="button" data-action="delete" class="danger" title="حذف"><i class="fas fa-trash"></i></button>
                    </div>
                </div>

            </article>
        `;

    }).join('');

}


// ===== کلیک روی دکمه‌های کارت‌ها =====
$('bannerList').addEventListener('click', async e => {

    const btn = e.target.closest('[data-action]');
    if (!btn || btn.dataset.action === 'toggle') return;

    const card = btn.closest('.bn-card');
    const id = Number(card.dataset.id);
    const banner = banners.find(b => b.id === id);
    const index = banners.indexOf(banner);

    try {

        switch (btn.dataset.action) {

            case 'edit':
                editBanner(banner);
                break;

            case 'duplicate': {
                const { id: _id, views, clicks, ctr, createdAt, sortOrder, ...copy } = banner;
                await api('', { method: 'POST', body: JSON.stringify({ ...copy, active: false }) });
                await loadBanners();
                showNotification('یک کپی (خاموش) از بنر ساخته شد', 'success');
                break;
            }

            case 'delete':
                if (!confirm(`بنر «${banner.title} ${banner.highlight || ''}» حذف شود؟`)) return;
                await api(`/${id}`, { method: 'DELETE' });
                if (Number($('bannerId').value) === id) startNewBanner();
                await loadBanners();
                showNotification('بنر حذف شد', 'success');
                break;

            case 'up':
            case 'down': {
                const target = btn.dataset.action === 'up' ? index - 1 : index + 1;
                [banners[index], banners[target]] = [banners[target], banners[index]];
                await saveOrder();
                break;
            }

        }

    } catch (err) {

        showNotification(err.message, 'error');

    }

});


// ===== روشن/خاموش کردن سریع =====
$('bannerList').addEventListener('change', async e => {

    if (e.target.dataset.action !== 'toggle') return;

    const id = Number(e.target.closest('.bn-card').dataset.id);

    try {
        await api(`/${id}`, { method: 'PUT', body: JSON.stringify({ active: e.target.checked }) });
        await loadBanners();
        showNotification(e.target.checked ? 'بنر روشن شد' : 'بنر خاموش شد', 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }

});


// ===== مرتب‌سازی با کشیدن کارت‌ها (Drag & Drop) =====
(function initDragSort() {

    const list = $('bannerList');
    let dragged = null;

    list.addEventListener('dragstart', e => {
        dragged = e.target.closest('.bn-card');
        if (!dragged) return;
        dragged.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragged.dataset.id);
    });

    list.addEventListener('dragover', e => {

        if (!dragged) return;

        e.preventDefault();

        const after = [...list.querySelectorAll('.bn-card:not(.dragging)')].find(card => {
            const box = card.getBoundingClientRect();
            return e.clientY < box.top + box.height / 2;
        });

        after ? list.insertBefore(dragged, after) : list.appendChild(dragged);

    });

    list.addEventListener('dragend', async () => {

        if (!dragged) return;

        dragged.classList.remove('dragging');
        dragged = null;

        const ids = [...list.querySelectorAll('.bn-card')].map(c => Number(c.dataset.id));

        if (ids.join() === banners.map(b => b.id).join()) return;

        banners = ids.map(id => banners.find(b => b.id === id));

        try {
            await saveOrder();
        } catch (err) {
            showNotification(err.message, 'error');
        }

    });

})();

async function saveOrder() {
    await api('/reorder', { method: 'PUT', body: JSON.stringify({ ids: banners.map(b => b.id) }) });
    await loadBanners();
    showNotification('ترتیب بنرها ذخیره شد', 'success');
}


// ============================================================
// فرم
// ============================================================

function renderThemePicker() {

    $('bannerThemes').innerHTML = BANNER_THEMES.map(t => `
        <button type="button" class="bn-theme" data-theme="${t.key}" title="${t.label}"
            style="background:linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})">
            <span>${t.label}</span>
        </button>
    `).join('');

    $('bannerThemes').addEventListener('click', e => {
        const btn = e.target.closest('.bn-theme');
        if (!btn) return;
        setTheme(btn.dataset.theme);
        onFormChange();
    });

}

function setTheme(key) {
    $('bannerTheme').value = key;
    document.querySelectorAll('.bn-theme').forEach(b => b.classList.toggle('active', b.dataset.theme === key));
}

function renderIconPicker() {

    $('bannerIcons').innerHTML = BANNER_ICONS.map(icon => `
        <button type="button" class="bn-icon" data-icon="${icon}" title="${icon}"><i class="fas ${icon}"></i></button>
    `).join('');

    $('bannerIcons').addEventListener('click', e => {
        const btn = e.target.closest('.bn-icon');
        if (!btn) return;
        setIcon(btn.dataset.icon);
        onFormChange();
    });

}

function setIcon(icon) {
    $('bannerIcon').value = icon;
    document.querySelectorAll('.bn-icon').forEach(b => b.classList.toggle('active', b.dataset.icon === icon));
}

function setImage(src) {

    $('bannerImage').value = src || '';
    $('bannerImageRemove').hidden = !src;

    $('bannerImageBox').innerHTML = src
        ? `<img src="${escapeHTML(resolveAsset(src))}" alt="" />`
        : '<div class="bn-image-empty"><i class="fas fa-image"></i> بدون عکس؛ آیکون نمایش داده می‌شود</div>';

}


// ===== تبدیل ISO ↔ مقدار input از نوع datetime-local (به وقت محلی) =====
function isoToLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}


function readForm() {
    return {
        id: Number($('bannerId').value) || null,
        theme: $('bannerTheme').value,
        badge: $('bannerBadge').value.trim(),
        title: $('bannerTitle').value.trim(),
        highlight: $('bannerHighlight').value.trim(),
        subtitle: $('bannerSubtitle').value.trim(),
        buttonText: $('bannerButtonText').value.trim(),
        buttonLink: $('bannerButtonLink').value.trim(),
        image: $('bannerImage').value,
        icon: $('bannerIcon').value,
        startsAt: localInputToIso($('bannerStartsAt').value),
        endsAt: localInputToIso($('bannerEndsAt').value),
        countdownEnd: localInputToIso($('bannerCountdownEnd').value),
        active: $('bannerActive').checked
    };
}

function fillForm(b) {
    $('bannerId').value = b.id || '';
    setTheme(b.theme || 'ocean');
    $('bannerBadge').value = b.badge || '';
    $('bannerTitle').value = b.title || '';
    $('bannerHighlight').value = b.highlight || '';
    $('bannerSubtitle').value = b.subtitle || '';
    $('bannerButtonText').value = b.buttonText || '';
    $('bannerButtonLink').value = b.buttonLink || '';
    setImage(b.image || '');
    setIcon(b.icon || 'fa-camera-retro');
    $('bannerStartsAt').value = isoToLocalInput(b.startsAt);
    $('bannerEndsAt').value = isoToLocalInput(b.endsAt);
    $('bannerCountdownEnd').value = isoToLocalInput(b.countdownEnd);
    $('bannerActive').checked = b.active !== false;
}


function startNewBanner() {

    fillForm({
        theme: BANNER_THEMES[banners.length % BANNER_THEMES.length].key,
        title: 'عنوان بنر',
        highlight: 'جدید',
        buttonText: 'مشاهده محصولات',
        buttonLink: 'pages/products.html',
        active: true
    });

    $('bannerFormTitle').innerHTML = '<i class="fas fa-plus-circle"></i> بنر جدید';
    $('bannerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> ذخیره بنر';

    renderList();
    onFormChange();

    $('bannerFormSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('bannerTitle').select(), 400);

}

function editBanner(banner) {

    fillForm(banner);

    $('bannerFormTitle').innerHTML = '<i class="fas fa-pen"></i> ویرایش بنر';
    $('bannerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> بروزرسانی بنر';

    renderList();
    onFormChange();

    $('bannerFormSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

}


function bindForm() {

    const form = $('bannerForm');

    form.addEventListener('input', onFormChange);
    form.addEventListener('change', onFormChange);

    form.addEventListener('submit', async e => {

        e.preventDefault();

        const data = readForm();

        if (!data.title) {
            showNotification('عنوان بنر الزامی است', 'error');
            return;
        }

        try {

            if (data.id) {
                await api(`/${data.id}`, { method: 'PUT', body: JSON.stringify(data) });
                showNotification('بنر بروزرسانی شد', 'success');
            } else {
                const created = await api('', { method: 'POST', body: JSON.stringify(data) });
                $('bannerId').value = created.id;
                $('bannerFormTitle').innerHTML = '<i class="fas fa-pen"></i> ویرایش بنر';
                $('bannerSubmitBtn').innerHTML = '<i class="fas fa-save"></i> بروزرسانی بنر';
                showNotification('بنر جدید ساخته شد و در اسلایدر قرار گرفت', 'success');
            }

            await loadBanners();

        } catch (err) {

            showNotification(err.message, 'error');

        }

    });

    $('bannerResetBtn').addEventListener('click', startNewBanner);
    $('newBannerBtn').addEventListener('click', startNewBanner);

    // ===== عکس: آپلود / اینترنت / حذف =====
    $('bannerImageFile').addEventListener('change', async e => {

        const file = e.target.files[0];
        if (!file) return;

        try {
            setImage(await AdminSmart.compressImage(file, 1400, 0.82));
            onFormChange();
        } catch (err) {
            showNotification('خواندن عکس با مشکل مواجه شد', 'error');
        }

        e.target.value = '';

    });

    $('bannerImageWeb').addEventListener('click', async () => {

        const text = `${$('bannerTitle').value} ${$('bannerHighlight').value}`;
        const path = await AdminSmart.pickInternetImage({
            query: AdminSmart.suggestImageQuery(text, 'camera'),
            name: 'banner'
        });

        if (path) {
            setImage(path);
            onFormChange();
            showNotification('عکس دانلود و روی بنر قرار گرفت', 'success');
        }

    });

    $('bannerImageRemove').addEventListener('click', () => {
        setImage('');
        onFormChange();
    });

    // ===== دکمه‌های سریع شمارش معکوس =====
    document.querySelectorAll('[data-countdown-days]').forEach(btn => {
        btn.addEventListener('click', () => {
            const days = Number(btn.dataset.countdownDays);
            $('bannerCountdownEnd').value = days
                ? isoToLocalInput(new Date(Date.now() + days * 86400000).toISOString())
                : '';
            onFormChange();
        });
    });

    // ===== ساخت بنر از محصول =====
    $('bannerFromProduct').addEventListener('change', e => {
        const product = catalog.find(p => p.id === Number(e.target.value));
        if (product) fillFromProduct(product);
        e.target.value = '';
    });

    $('bannerSuggestCopy').addEventListener('click', suggestCopy);

}


// ============================================================
// هوشمندی فرم
// ============================================================

function fillProductSelect() {

    // اول محصولات تخفیف‌دار و پرفروش (مناسب‌ترین گزینه‌ها برای بنر)
    const score = p => (p.discounted ? 2 : 0) + (p.bestseller ? 1 : 0);

    $('bannerFromProduct').insertAdjacentHTML('beforeend', [...catalog]
        .sort((a, b) => score(b) - score(a))
        .map(p => `<option value="${p.id}">${escapeHTML(p.name)}${p.discount ? ` — ${escapeHTML(p.discount)} تخفیف` : ''}</option>`)
        .join(''));

}

function fillFromProduct(p) {

    const themeByCategory = { camera: 'ocean', nvr: 'neon', package: 'sunset', accessory: 'emerald' };

    fillForm({
        ...readForm(),
        theme: themeByCategory[p.category] || 'ocean',
        badge: p.discount ? '🔥 پیشنهاد شگفت‌انگیز' : (p.bestseller ? '🏆 پرفروش‌ترین' : '✨ محصول ویژه'),
        title: p.name,
        highlight: p.discount ? `${p.discount} تخفیف` : 'با گارانتی ۲ ساله',
        subtitle: p.desc || '',
        buttonText: 'مشاهده و خرید',
        buttonLink: `pages/product.html?id=${p.id}`,
        image: p.image || '',
        icon: p.icon || 'fa-camera-retro',
        countdownEnd: p.discount ? new Date(Date.now() + 3 * 86400000).toISOString() : ''
    });

    onFormChange();
    showNotification('بنر از روی محصول ساخته شد؛ اگر خواستی ویرایش و بعد ذخیره کن', 'success');

}

// ===== چند الگوی متن تبلیغاتی آماده (هر بار کلیک، الگوی بعدی) =====
function suggestCopy() {

    const presets = [
        { badge: '🎉 جشنواره بزرگ فصل', title: 'تا', highlight: '۶۰٪ تخفیف ویژه', subtitle: 'بهترین دوربین‌های مداربسته با گارانتی ۲ ساله و نصب رایگان', buttonText: 'مشاهده تخفیف‌ها', buttonLink: 'pages/products.html?filter=discount', theme: 'ocean', icon: 'fa-percent' },
        { badge: '🤖 نسل جدید', title: 'دوربین‌های', highlight: 'هوش مصنوعی', subtitle: 'تشخیص انسان و خودرو و ارسال هشدار لحظه‌ای روی موبایل', buttonText: 'مشاهده دوربین‌ها', buttonLink: 'pages/products.html?cat=camera', theme: 'neon', icon: 'fa-eye' },
        { badge: '📦 همه‌چیز در یک جعبه', title: 'پکیج کامل', highlight: 'با نصب رایگان', subtitle: 'دوربین + دستگاه ضبط + کابل و اتصالات، آماده‌ی نصب', buttonText: 'مشاهده پکیج‌ها', buttonLink: 'pages/products.html?cat=package', theme: 'sunset', icon: 'fa-box-open' },
        { badge: '🚚 ارسال سریع', title: 'ارسال رایگان', highlight: 'به سراسر کشور', subtitle: 'برای خریدهای بالای ۲۰ میلیون تومان، همراه با پشتیبانی ۲۴ ساعته', buttonText: 'شروع خرید', buttonLink: 'pages/products.html', theme: 'emerald', icon: 'fa-truck-fast' },
        { badge: '👑 انتخاب حرفه‌ای‌ها', title: 'پرفروش‌ترین', highlight: 'محصولات ماه', subtitle: 'محصولاتی که بیشترین رضایت مشتری را داشته‌اند', buttonText: 'مشاهده پرفروش‌ها', buttonLink: 'pages/products.html?filter=bestseller', theme: 'royal', icon: 'fa-bolt' },
        { badge: '🛡️ امنیت ۲۴/۷', title: 'خیالت راحت،', highlight: 'ما مراقبیم', subtitle: 'مشاوره رایگان برای انتخاب بهترین سیستم نظارتی خانه و محل کار', buttonText: 'مشاوره و خرید', buttonLink: 'pages/products.html', theme: 'midnight', icon: 'fa-shield-halved' }
    ];

    const preset = presets[copyVariant % presets.length];
    copyVariant++;

    fillForm({ ...readForm(), ...preset });
    onFormChange();

}


// ===== هشدارهای هوشمند فرم =====
function formHints(data) {

    const hints = [];
    const now = Date.now();

    if (data.title.length + data.highlight.length > 45) hints.push('عنوان طولانی است؛ روی موبایل در چند خط می‌شکند (کمتر از ۴۵ حرف بهتر است).');
    if (data.buttonText && !data.buttonLink) hints.push('دکمه متن دارد ولی لینک ندارد.');
    if (!data.buttonText) hints.push('بنر بدون دکمه معمولاً کلیک کمتری می‌گیرد.');
    if (data.countdownEnd && Date.parse(data.countdownEnd) < now) hints.push('زمان شمارش معکوس گذشته است و نمایش داده نمی‌شود.');
    if (data.startsAt && data.endsAt && Date.parse(data.endsAt) <= Date.parse(data.startsAt)) hints.push('پایان نمایش قبل از شروع آن است!');
    if (data.endsAt && Date.parse(data.endsAt) < now) hints.push('زمان نمایش این بنر تمام شده و در سایت دیده نمی‌شود.');
    if (data.countdownEnd && data.endsAt && Date.parse(data.countdownEnd) > Date.parse(data.endsAt)) hints.push('شمارش معکوس بعد از پایان نمایش بنر تمام می‌شود.');

    return hints;

}


let previewTimer = 0;

function onFormChange() {

    const data = readForm();
    const hints = formHints(data);
    const box = $('bannerHints');

    box.classList.add('show');
    box.classList.toggle('ok', hints.length === 0);
    box.innerHTML = hints.length
        ? hints.map(h => `<div><i class="fas fa-triangle-exclamation"></i> ${h}</div>`).join('')
        : '<i class="fas fa-circle-check"></i> همه‌چیز درست به نظر می‌رسد.';

    const preview = $('bannerPreview');
    preview.classList.add('is-typing');
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => preview.classList.remove('is-typing'), 700);

    refreshPreview(data);

}


// ===== پیش‌نمایش: همه‌ی بنرها به ترتیب، با پیش‌نویس فعلی به جای نسخه‌ی ذخیره‌شده =====
function refreshPreview(draft) {

    const preview = $('bannerPreview');

    let list = banners.map(b => (draft && draft.id === b.id ? { ...b, ...draft } : b));
    let focus = draft && draft.id ? list.findIndex(b => b.id === draft.id) : -1;

    if (draft && !draft.id) {
        list = [...list, { ...draft, id: 0 }];
        focus = list.length - 1;
    }

    if (list.length === 0) {
        list = [{ title: 'اولین بنر را بساز', highlight: '✨', subtitle: 'فرم پایین را پر کن تا اینجا پیش‌نمایش ببینی', theme: 'ocean' }];
    }

    const slider = BannerSlider.mount(preview, list, { preview: true, autoplay: !draft });

    if (focus > 0) slider.goTo(focus, false);

}


function showNotification(message, type = 'success') {
    const notif = $('adminNotification');
    notif.textContent = message;
    notif.className = 'admin-notification show ' + type;
    clearTimeout(notif._timeout);
    notif._timeout = setTimeout(() => notif.classList.remove('show'), 3000);
}
