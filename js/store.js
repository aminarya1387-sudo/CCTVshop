// ============================================================
// AMIN SYSTEM - PRODUCT STORE
// منبع مشترک محصولات بین صفحه اصلی، صفحه محصولات، صفحه جزئیات
// و پنل مدیریت. حالا به‌جای localStorage، با fetch به بک‌اند
// واقعی (server/) وصل می‌شود. همه متدها async هستند.
// ============================================================

// ===== مسیر پایه برای فایل‌های assets بسته به عمق صفحه فعلی =====
// (صفحات داخل pages/ و admin/ یک پوشه پایین‌تر از ریشه سایت هستند)
const ASSET_BASE =
    (location.pathname.includes('/pages/') || location.pathname.includes('/admin/'))
        ? '../'
        : '';

function resolveAsset(path) {
    if (!path) return '';
    // اگر عکس آپلودی (data URL) یا آدرس کامل بود، دست‌نخورده برگردان
    if (path.startsWith('data:') || path.startsWith('http') || path.startsWith('../') || path.startsWith('/')) {
        return path;
    }
    return ASSET_BASE + path;
}

// ===== HTML عکس یا آیکون محصول (هرکدام موجود بود) =====
function productMedia(p) {

    if (p.image) {
        return `<img src="${resolveAsset(p.image)}" alt="${p.name || ''}" loading="lazy" />`;
    }

    return `<i class="fas ${p.icon || 'fa-camera-retro'}"></i>`;

}


// ===== گالری کامل محصول (عکس اصلی + تصاویر بندانگشتی) برای صفحه جزئیات =====
function productGalleryMedia(p) {

    const images = (Array.isArray(p.images) && p.images.length > 0)
        ? p.images
        : (p.image ? [p.image] : []);

    if (images.length === 0) {
        return `<div class="gallery-main"><i class="fas ${p.icon || 'fa-camera-retro'}"></i></div>`;
    }

    const thumbsHTML = images.length > 1
        ? `
            <div class="gallery-thumbs">
                ${images.map((img, i) => `
                    <button type="button" class="gallery-thumb ${i === 0 ? 'active' : ''}" data-src="${resolveAsset(img)}">
                        <img src="${resolveAsset(img)}" alt="" loading="lazy" />
                    </button>
                `).join('')}
            </div>
        `
        : '';

    return `
        <div class="gallery-main">
            <img id="galleryMainImg" src="${resolveAsset(images[0])}" alt="${p.name || ''}" />
        </div>
        ${thumbsHTML}
    `;

}


// ===== فعال کردن کلیک روی تصاویر بندانگشتی گالری (باید بعد از رندر صدا زده شود) =====
function initProductGalleryThumbs(rootEl) {

    const mainImg = rootEl.querySelector('#galleryMainImg');
    const thumbs = rootEl.querySelectorAll('.gallery-thumb');

    if (!mainImg || thumbs.length === 0) return;

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImg.src = thumb.dataset.src;
            thumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

}


// ============================================================
// کارت نمایش سفارش (بین track-order.js و my-orders.js مشترک است)
// ============================================================

const orderStatusSteps = [
    { key: 'pending', label: 'در انتظار', icon: 'fa-clock' },
    { key: 'confirmed', label: 'تأییدشده', icon: 'fa-check' },
    { key: 'shipped', label: 'ارسال‌شده', icon: 'fa-truck' }
];

const orderPaymentLabels = {
    cod: 'پرداخت درب منزل',
    transfer: 'کارت به کارت'
};


function formatOrderDate(iso) {
    try {
        return new Date(iso).toLocaleString('fa-IR');
    } catch (e) {
        return '';
    }
}


// ===== HTML کارت یک سفارش (وضعیت + مشخصات گیرنده + اقلام + مبلغ) =====
function buildOrderCardHTML(order) {

    let statusHTML = '';

    if (order.status === 'cancelled') {

        statusHTML = `
            <div class="track-cancelled-card">
                <i class="fas fa-circle-xmark"></i>
                این سفارش لغو شده است.
            </div>
        `;

    } else {

        const currentIndex = orderStatusSteps.findIndex(s => s.key === order.status);

        statusHTML = `
            <div class="track-stepper">
                ${orderStatusSteps.map((s, i) => {
                    const state = i <= currentIndex ? 'done' : '';
                    const current = i === currentIndex ? 'current' : '';
                    return `
                        <div class="track-step ${state} ${current}">
                            <div class="step-circle"><i class="fas ${s.icon}"></i></div>
                            <div class="step-label">${s.label}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

    }

    return `
        <div class="track-result-card">

            <div class="track-result-head">
                <span class="order-number">${order.orderNumber}</span>
                <span class="track-date">ثبت‌شده در ${formatOrderDate(order.createdAt)}</span>
            </div>

            ${statusHTML}

            <div class="track-details-grid">

                <div class="track-detail-block">
                    <h4><i class="fas fa-user"></i> مشخصات گیرنده</h4>
                    <div class="track-detail-row"><span>نام</span><strong>${order.customer.name}</strong></div>
                    <div class="track-detail-row"><span>موبایل</span><strong>${order.customer.phone}</strong></div>
                    <div class="track-detail-row"><span>شهر</span><strong>${order.customer.city}</strong></div>
                    <div class="track-detail-row"><span>آدرس</span><strong>${order.customer.address}</strong></div>
                    <div class="track-detail-row"><span>روش پرداخت</span><strong>${orderPaymentLabels[order.payment] || order.payment}</strong></div>
                </div>

                <div class="track-detail-block">
                    <h4><i class="fas fa-box"></i> اقلام سفارش (${order.totalCount || 0} کالا)</h4>
                    <div class="track-result-items">
                        ${order.items.map(item => `
                            <div class="track-item-row">
                                <div class="item-icon">${productMedia(item)}</div>
                                <div>
                                    <span class="item-name">${item.name} × ${item.quantity}</span>
                                    ${item.desc ? `<span class="track-item-desc">${item.desc}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

            </div>

            <div class="track-result-total">
                <span>مبلغ کل</span>
                <span>${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان</span>
            </div>

        </div>
    `;

}


const ProductStore = {

    API: '/api/products',

    // ===== خواندن همه محصولات =====
    async getAll() {

        const res = await fetch(this.API);

        if (!res.ok) {
            console.error('ProductStore: خواندن محصولات با خطا مواجه شد');
            return [];
        }

        return res.json();

    },

    // ===== افزودن محصول جدید (نیاز به لاگین ادمین) =====
    async add(product) {

        const res = await fetch(this.API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'افزودن محصول با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== ویرایش محصول (نیاز به لاگین ادمین) =====
    async update(id, data) {

        const res = await fetch(`${this.API}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'ویرایش محصول با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== حذف محصول (نیاز به لاگین ادمین) =====
    async remove(id) {

        const res = await fetch(`${this.API}/${id}`, { method: 'DELETE' });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'حذف محصول با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== یک محصول بر اساس آیدی =====
    async getById(id) {

        const res = await fetch(`${this.API}/${id}`);

        if (!res.ok) return null;

        return res.json();

    },

    // ===== تعداد محصولات هر دسته (برای بخش دسته‌بندی صفحه اصلی) =====
    async getCategoryCounts() {

        const counts = {
            camera: 0,
            nvr: 0,
            package: 0,
            accessory: 0
        };

        const all = await this.getAll();

        all.forEach(p => {

            if (counts[p.category] !== undefined) {
                counts[p.category]++;
            }

        });

        return counts;

    }

};
