// ============================================================
// AMIN SYSTEM - ADMIN SMART TOOLS
// ابزارهای هوشمند مشترک همه‌ی صفحات پنل مدیریت:
//   - جستجوی سریع سراسری (Ctrl + K): صفحات، کارها، محصولات، سفارش‌ها
//   - شمارنده‌های زنده روی سایدبار (سفارش در انتظار، موجودی کم)
//   - انتخاب و دانلود عکس آزاد از اینترنت (Wikimedia Commons)
// بعد از auth.js و قبل از اسکریپت اختصاصی هر صفحه لود می‌شود.
// ============================================================

function escapeHTML(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const toFaDigits = value => String(value).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

// اعداد فارسی/عربی ← انگلیسی (برای جستجو و محاسبه)
const toEnDigits = value => String(value == null ? '' : value)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));


const AdminSmart = {

    session: null,
    perms: [],
    cache: {},

    // ===== بعد از رندر سایدبار صدا زده می‌شود (از auth.js) =====
    init(session) {

        this.session = session;
        this.perms = rolePermissions[session.role] || [];

        this.buildPalette();
        this.decorateSidebar();

    },

    can(section) {
        return this.perms.includes(section);
    },

    // ===== داده‌ها با کش ساده (هر صفحه یک بار) =====
    async products(fresh = false) {
        if (!this.can('products')) return [];
        if (fresh || !this.cache.products) {
            this.cache.products = ProductStore.getAll();
        }
        return this.cache.products;
    },

    async orders(fresh = false) {
        if (!this.can('orders')) return [];
        if (fresh || !this.cache.orders) {
            this.cache.orders = fetch('/api/orders').then(r => (r.ok ? r.json() : [])).catch(() => []);
        }
        return this.cache.orders;
    },


    // ============================================================
    // شمارنده‌های زنده روی سایدبار
    // ============================================================
    async decorateSidebar() {

        const addBadge = (key, count, title) => {
            const link = document.querySelector(`.admin-side-link[data-key="${key}"]`);
            if (!link || !count) return;
            link.insertAdjacentHTML('beforeend', `<span class="badge-count" title="${title}">${toFaDigits(count)}</span>`);
        };

        const [products, orders] = await Promise.all([this.products(), this.orders()]);

        addBadge('orders', orders.filter(o => o.status === 'pending').length, 'سفارش در انتظار بررسی');
        addBadge('products', products.filter(p => Number(p.stock) <= 5).length, 'محصول با موجودی کم یا تمام‌شده');

    },


    // ============================================================
    // جستجوی سریع (Ctrl + K)
    // ============================================================
    buildPalette() {

        if (document.getElementById('cgPalette')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="cg-palette" id="cgPalette" aria-hidden="true">
                <div class="cg-palette-box" role="dialog" aria-label="جستجوی سریع">
                    <div class="cg-palette-input">
                        <i class="fas fa-magnifying-glass"></i>
                        <input type="text" id="cgPaletteInput" placeholder="جستجو در صفحات، محصولات، سفارش‌ها یا یک کار…" autocomplete="off" />
                    </div>
                    <div class="cg-palette-list" id="cgPaletteList"></div>
                    <div class="cg-palette-foot">
                        <span><kbd>↑</kbd> <kbd>↓</kbd> جابه‌جایی</span>
                        <span><kbd>Enter</kbd> انتخاب</span>
                        <span><kbd>Esc</kbd> بستن</span>
                    </div>
                </div>
            </div>
        `);

        const palette = document.getElementById('cgPalette');
        const input = document.getElementById('cgPaletteInput');
        const list = document.getElementById('cgPaletteList');

        let items = [];
        let selected = 0;

        const staticItems = () => {

            const result = adminSections
                .filter(s => this.can(s.key))
                .map(s => ({ group: 'صفحات', icon: s.icon, label: s.title, href: s.href }));

            if (this.can('products')) {
                result.push({ group: 'کارها', icon: 'fa-plus', label: 'افزودن محصول جدید', href: 'admin.html#new' });
                result.push({ group: 'کارها', icon: 'fa-triangle-exclamation', label: 'محصولات با موجودی کم', href: 'admin.html?filter=lowstock' });
            }

            if (this.can('banners')) {
                result.push({ group: 'کارها', icon: 'fa-images', label: 'افزودن بنر جدید', href: 'banners.html#new' });
            }

            if (this.can('orders')) {
                result.push({ group: 'کارها', icon: 'fa-clock', label: 'سفارش‌های در انتظار', href: 'orders.html?status=pending' });
            }

            result.push({ group: 'کارها', icon: 'fa-store', label: 'باز کردن سایت فروشگاه', href: 'http://localhost:3000/index.html', external: true });

            return result;

        };

        const render = async () => {

            const q = toEnDigits(input.value.trim().toLowerCase());

            const match = text => toEnDigits(String(text || '').toLowerCase()).includes(q);

            items = staticItems().filter(i => !q || match(i.label));

            if (q) {

                const [products, orders] = await Promise.all([this.products(), this.orders()]);

                products
                    .filter(p => match(p.name) || match(p.desc))
                    .slice(0, 6)
                    .forEach(p => items.push({
                        group: 'محصولات',
                        icon: p.icon || 'fa-camera-retro',
                        label: p.name,
                        meta: `موجودی ${toFaDigits(p.stock)}`,
                        href: `admin.html?edit=${p.id}`
                    }));

                orders
                    .filter(o => match(o.orderNumber) || match(o.customer.name) || match(o.customer.phone))
                    .slice(0, 6)
                    .forEach(o => items.push({
                        group: 'سفارش‌ها',
                        icon: 'fa-receipt',
                        label: `${o.orderNumber} - ${o.customer.name}`,
                        meta: `${(o.totalPrice || 0).toLocaleString('fa-IR')} تومان`,
                        href: `orders.html?q=${encodeURIComponent(o.orderNumber)}`
                    }));

            }

            selected = Math.min(selected, Math.max(0, items.length - 1));

            if (items.length === 0) {
                list.innerHTML = '<div class="cg-palette-empty">نتیجه‌ای پیدا نشد</div>';
                return;
            }

            let lastGroup = '';

            list.innerHTML = items.map((item, i) => {

                const header = item.group !== lastGroup ? `<div class="cg-palette-group">${item.group}</div>` : '';
                lastGroup = item.group;

                return `
                    ${header}
                    <button type="button" class="cg-palette-item ${i === selected ? 'selected' : ''}" data-index="${i}">
                        <i class="fas ${escapeHTML(item.icon)}"></i>
                        <span>${escapeHTML(item.label)}</span>
                        ${item.meta ? `<small>${escapeHTML(item.meta)}</small>` : ''}
                    </button>
                `;

            }).join('');

            const current = list.querySelector('.cg-palette-item.selected');
            current && current.scrollIntoView({ block: 'nearest' });

        };

        const choose = i => {

            const item = items[i];
            if (!item) return;

            close();

            if (item.external) {
                window.open(item.href, '_blank');
                return;
            }

            // لینک به همین صفحه با hash (مثلاً #new) → فقط رویداد hashchange
            const target = new URL(item.href, location.href);
            if (target.pathname === location.pathname && target.search === location.search) {
                location.hash = target.hash;
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            } else {
                location.href = item.href;
            }

        };

        const open = () => {
            palette.classList.add('open');
            palette.setAttribute('aria-hidden', 'false');
            input.value = '';
            selected = 0;
            input.focus();
            render();
        };

        const close = () => {
            palette.classList.remove('open');
            palette.setAttribute('aria-hidden', 'true');
        };

        this.openPalette = open;

        let debounce = 0;
        input.addEventListener('input', () => {
            selected = 0;
            clearTimeout(debounce);
            debounce = setTimeout(render, 80);
        });

        input.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % Math.max(1, items.length); render(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + items.length) % Math.max(1, items.length); render(); }
            if (e.key === 'Enter') { e.preventDefault(); choose(selected); }
        });

        list.addEventListener('click', e => {
            const btn = e.target.closest('.cg-palette-item');
            if (btn) choose(Number(btn.dataset.index));
        });

        palette.addEventListener('click', e => {
            if (e.target === palette) close();
        });

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
                e.preventDefault();
                palette.classList.contains('open') ? close() : open();
            }
            if (e.key === 'Escape' && palette.classList.contains('open')) close();
        });

        const sideBtn = document.getElementById('adminSideSearch');
        sideBtn && sideBtn.addEventListener('click', open);

    },


    // ============================================================
    // انتخاب عکس از اینترنت → دانلود داخل assets/products → مسیر عکس
    // ============================================================
    pickInternetImage({ query = '', name = 'image' } = {}) {

        return new Promise(resolve => {

            let modal = document.getElementById('cgImageModal');

            if (!modal) {

                document.body.insertAdjacentHTML('beforeend', `
                    <div class="cg-modal" id="cgImageModal" aria-hidden="true">
                        <div class="cg-modal-box" role="dialog" aria-label="جستجوی عکس از اینترنت">
                            <div class="cg-modal-head">
                                <i class="fas fa-globe" style="color:var(--cg-cyan)"></i>
                                <h3>جستجوی عکس آزاد از اینترنت</h3>
                                <button type="button" class="cg-modal-close" data-close aria-label="بستن"><i class="fas fa-xmark"></i></button>
                            </div>
                            <form class="cg-modal-search" id="cgImageSearchForm">
                                <input type="text" class="cg-input" id="cgImageQuery" placeholder="مثلاً: dome camera, NVR, PTZ camera" dir="auto" />
                                <button type="submit" class="cg-btn-primary" style="padding:0 20px;border-radius:12px;cursor:pointer;font:inherit;font-weight:700">
                                    <i class="fas fa-magnifying-glass"></i> جستجو
                                </button>
                            </form>
                            <div class="cg-modal-body">
                                <div class="cg-modal-status" id="cgImageStatus"></div>
                                <div class="cg-img-results" id="cgImageResults"></div>
                            </div>
                        </div>
                    </div>
                `);

                modal = document.getElementById('cgImageModal');

            }

            const form = modal.querySelector('#cgImageSearchForm');
            const queryInput = modal.querySelector('#cgImageQuery');
            const status = modal.querySelector('#cgImageStatus');
            const results = modal.querySelector('#cgImageResults');

            let found = [];
            let busy = false;

            const close = value => {
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
                form.onsubmit = null;
                results.onclick = null;
                modal.onclick = null;
                document.removeEventListener('keydown', onEsc);
                resolve(value || null);
            };

            const onEsc = e => { if (e.key === 'Escape') close(null); };

            const search = async () => {

                const q = queryInput.value.trim();
                if (!q) return;

                results.innerHTML = '';
                status.className = 'cg-modal-status';
                status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال جستجو در Wikimedia Commons…';

                try {

                    const res = await fetch(`/api/images/search?q=${encodeURIComponent(q)}`);
                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || 'جستجو ناموفق بود');

                    found = data;

                    if (found.length === 0) {
                        status.textContent = 'عکسی با مجوز آزاد پیدا نشد؛ عبارت دیگری (ترجیحاً انگلیسی) امتحان کن.';
                        return;
                    }

                    status.textContent = 'روی عکس دلخواه کلیک کن تا دانلود و اضافه شود (مجوز و منبع در assets/products/CREDITS.md ثبت می‌شود).';

                    results.innerHTML = found.map((img, i) => `
                        <button type="button" class="cg-img-result" data-index="${i}" title="${escapeHTML(img.title)} — ${escapeHTML(img.license)}">
                            <img src="${escapeHTML(img.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
                            <span>${escapeHTML(img.license)} · ${escapeHTML(img.author || img.title)}</span>
                        </button>
                    `).join('');

                } catch (e) {

                    status.className = 'cg-modal-status error';
                    status.innerHTML = `${escapeHTML(e.message)}<br>سرور مدیریت باید به اینترنت دسترسی داشته باشد.`;

                }

            };

            form.onsubmit = e => { e.preventDefault(); search(); };

            results.onclick = async e => {

                const btn = e.target.closest('.cg-img-result');
                if (!btn || busy) return;

                const img = found[Number(btn.dataset.index)];
                busy = true;
                btn.classList.add('loading');

                try {

                    const res = await fetch('/api/images/download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: img.url, name, credit: img })
                    });

                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || 'دانلود ناموفق بود');

                    close(data.path);

                } catch (err) {

                    status.className = 'cg-modal-status error';
                    status.textContent = err.message;

                } finally {

                    busy = false;
                    btn.classList.remove('loading');

                }

            };

            modal.onclick = e => {
                if (e.target === modal || e.target.closest('[data-close]')) close(null);
            };

            document.addEventListener('keydown', onEsc);

            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            queryInput.value = query;
            results.innerHTML = '';
            status.className = 'cg-modal-status';
            status.textContent = 'یک عبارت (ترجیحاً انگلیسی) بنویس و جستجو کن.';
            setTimeout(() => queryInput.focus(), 30);

            if (query) search();

        });

    },


    // ===== عبارت جستجوی انگلیسی پیشنهادی برای نام محصول فارسی =====
    suggestImageQuery(name, category) {

        const rules = [
            [/پکیج|package|kit/i, 'CCTV cameras kit'],
            [/doorbell|زنگ/i, 'video doorbell'],
            [/ptz|چرخش/i, 'PTZ camera'],
            [/dome|دام/i, 'dome surveillance camera'],
            [/۳۶۰|360|پانوراما/i, 'fisheye security camera'],
            [/مخفی|مینیاتوری/i, 'miniature camera'],
            [/bullet|بولت|صنعتی/i, 'bullet CCTV camera'],
            [/nvr/i, 'network video recorder'],
            [/dvr/i, 'digital video recorder CCTV'],
            [/کابل|cable/i, 'coaxial cable'],
            [/براکت|bracket/i, 'camera wall mount bracket'],
            [/آداپتور|adapter/i, 'power adapter 12V'],
            [/هارد|hdd/i, 'hard disk drive']
        ];

        const rule = rules.find(([re]) => re.test(name || ''));

        if (rule) return rule[1];

        return { camera: 'CCTV camera', nvr: 'network video recorder', package: 'CCTV system', accessory: 'CCTV accessories' }[category] || 'security camera';

    },


    // ===== کوچک‌کردن عکس آپلودی (مشترک محصولات و بنرها) =====
    compressImage(file, maxWidth, quality) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onerror = reject;

            reader.onload = () => {

                const img = new Image();

                img.onerror = reject;

                img.onload = () => {

                    const scale = Math.min(1, maxWidth / img.width);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                    resolve(canvas.toDataURL('image/jpeg', quality));

                };

                img.src = reader.result;

            };

            reader.readAsDataURL(file);

        });

    }

};
