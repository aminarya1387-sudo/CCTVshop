// ============================================================
// AMIN SYSTEM - ADMIN PANEL / PRODUCTS
// (از ProductStore مشترک استفاده می‌کند که حالا با fetch به
//  بک‌اند واقعی وصل است؛ همه توابع async هستند)
// ============================================================

let products = [];
let selectedImages = [];

// ===== وضعیت فیلتر/جستجو/مرتب‌سازی جدول =====
let listFilter = 'all';
let listQuery = '';
let listSort = 'id';

const LOW_STOCK = 5;

// آیکون پیشنهادی هر دسته (وقتی آیکون روی پیش‌فرض مانده باشد)
const CATEGORY_ICONS = {
    camera: 'fa-camera-retro',
    nvr: 'fa-server',
    package: 'fa-box-open',
    accessory: 'fa-plug'
};

const priceNumber = value => Number(toEnDigits(value).replace(/[^\d.]/g, '')) || 0;

(async function init() {

    const adminSession = await renderAdminSidebar('products');

    // اگر گارد ورود ریدایرکت کرد، بقیه کد اجرا نشود
    if (adminSession) {
        initProductsPage();
    }

})();


function initProductsPage() {

    initImageUpload();
    initSmartForm();
    initListControls();

    loadProducts().then(applyUrlParams);

    // ===== افزودن/ویرایش محصول =====
    document.getElementById('productForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value.trim();
        const desc = document.getElementById('productDesc').value.trim();
        const longDesc = document.getElementById('productLongDesc').value.trim();
        const price = document.getElementById('productPrice').value.trim();
        const oldPrice = document.getElementById('productOldPrice').value.trim();
        const discount = document.getElementById('productDiscount').value.trim();
        const icon = document.getElementById('productIcon').value.trim() || 'fa-camera-retro';
        const category = document.getElementById('productCategory').value;
        const bestseller = document.getElementById('productBestseller').checked;
        const stock = document.getElementById('productStock').value;

        if (!name || !price) {
            showNotification('لطفاً نام و قیمت محصول را وارد کنید!', 'error');
            return;
        }

        const data = {
            name, desc, longDesc, price, oldPrice, discount, icon, category,
            bestseller,
            discounted: !!discount,
            images: selectedImages,
            stock: stock === '' ? 20 : Number(stock)
        };

        try {

            if (id) {
                await ProductStore.update(Number(id), data);
                showNotification('محصول با موفقیت ویرایش شد!', 'success');
            } else {
                await ProductStore.add(data);
                showNotification('محصول جدید با موفقیت اضافه شد!', 'success');
            }

            await loadProducts();
            resetForm();

        } catch (err) {

            showNotification(err.message || 'ذخیره‌سازی با خطا مواجه شد!', 'error');

        }

    });

    // ===== دکمه ریست =====
    document.querySelector('.btn-reset').addEventListener('click', function (e) {
        e.preventDefault();
        resetForm();
    });

}


// ===== بارگذاری محصولات از ProductStore =====
async function loadProducts() {
    products = await ProductStore.getAll();
    renderTable();
    updateCount();
}


// ===== محصولات بعد از اعمال جستجو، فیلتر و مرتب‌سازی =====
function visibleProducts() {

    const q = toEnDigits(listQuery.trim().toLowerCase());

    const filters = {
        all: () => true,
        lowstock: p => Number(p.stock) <= LOW_STOCK,
        noimage: p => !p.image,
        discount: p => !!p.discount
    };

    const byFilter = filters[listFilter] || (p => p.category === listFilter);

    const sorters = {
        id: (a, b) => b.id - a.id,
        name: (a, b) => a.name.localeCompare(b.name, 'fa'),
        'price-asc': (a, b) => priceNumber(a.price) - priceNumber(b.price),
        'price-desc': (a, b) => priceNumber(b.price) - priceNumber(a.price),
        stock: (a, b) => a.stock - b.stock
    };

    return products
        .filter(byFilter)
        .filter(p => !q || toEnDigits(`${p.name} ${p.desc || ''}`.toLowerCase()).includes(q))
        .sort(sorters[listSort] || sorters.id);

}


// ===== رندر جدول =====
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    const empty = document.getElementById('tableEmpty');
    const list = visibleProducts();

    if (list.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        empty.querySelector('p').textContent = products.length ? 'محصولی با این فیلتر پیدا نشد' : 'هیچ محصولی ثبت نشده است';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = list.map((p, index) => {

        // هشدارهای کوچک کنار نام محصول
        const warnings = [];
        if (!p.image) warnings.push('<i class="fas fa-image pm-warn" title="بدون عکس"></i>');
        if ((p.desc || '').length < 15) warnings.push('<i class="fas fa-align-right pm-warn" title="توضیحات کوتاه"></i>');
        if (p.discount && !p.oldPrice) warnings.push('<i class="fas fa-percent pm-warn" title="تخفیف بدون قیمت قبلی"></i>');

        return `
        <tr>
            <td>${toFaDigits(index + 1)}</td>
            <td>${
                p.image
                    ? `<img class="product-thumb" src="${escapeHTML(resolveAsset(p.image))}" alt="" />`
                    : `<i class="fas ${escapeHTML(p.icon)} product-icon"></i>`
            }</td>
            <td>${escapeHTML(p.name)} ${warnings.join('')}</td>
            <td><span class="product-badge ${p.category}">${getCategoryName(p.category)}</span></td>
            <td>${escapeHTML(p.price)} هزار</td>
            <td>${escapeHTML(p.discount || '-')}</td>
            <td>
                <div class="pm-stock">
                    <span class="stock-badge ${p.stock <= 0 ? 'out' : (p.stock <= LOW_STOCK ? 'low' : '')}">
                        ${p.stock <= 0 ? 'ناموجود' : toFaDigits(p.stock)}
                    </span>
                    <button type="button" class="pm-restock" onclick="restockProduct(${p.id}, 10)" title="۱۰ عدد به موجودی اضافه کن">+۱۰</button>
                </div>
            </td>
            <td>
                <div class="actions">
                    <button class="btn-edit" onclick="editProduct(${p.id})" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;

    }).join('');
}


// ===== نام دسته‌بندی =====
function getCategoryName(cat) {
    const names = {
        camera: 'دوربین',
        nvr: 'NVR/DVR',
        package: 'پکیج',
        accessory: 'تجهیزات'
    };
    return names[cat] || cat;
}


// ===== آپدیت تعداد محصولات =====
function updateCount() {
    const shown = visibleProducts().length;
    document.getElementById('productCount').textContent = shown === products.length
        ? `${toFaDigits(products.length)} محصول`
        : `${toFaDigits(shown)} از ${toFaDigits(products.length)} محصول`;
}


// ============================================================
// ===== جستجو، فیلتر و مرتب‌سازی جدول =========================
// ============================================================

function initListControls() {

    document.getElementById('productSearch').addEventListener('input', e => {
        listQuery = e.target.value;
        renderTable();
        updateCount();
    });

    document.getElementById('productSort').addEventListener('change', e => {
        listSort = e.target.value;
        renderTable();
    });

    document.getElementById('productFilters').addEventListener('click', e => {
        const chip = e.target.closest('[data-filter]');
        if (chip) setListFilter(chip.dataset.filter);
    });

}

function setListFilter(filter) {

    listFilter = filter;

    document.querySelectorAll('#productFilters [data-filter]').forEach(c => {
        c.classList.toggle('active', c.dataset.filter === filter);
    });

    renderTable();
    updateCount();

}


// ===== پارامترهای آدرس: ?edit=ID ، ?filter=lowstock ، #new (از جستجوی سریع و داشبورد) =====
function applyUrlParams() {

    const params = new URLSearchParams(location.search);

    if (params.get('filter')) {
        setListFilter(params.get('filter'));
        document.querySelector('.admin-list-section').scrollIntoView({ behavior: 'smooth' });
    }

    if (params.get('edit')) {
        editProduct(Number(params.get('edit')));
    }

    const onHash = () => {
        if (location.hash === '#new') {
            resetForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('productName').focus();
        }
    };

    onHash();
    window.addEventListener('hashchange', onHash);

}


// ===== افزایش سریع موجودی =====
async function restockProduct(id, amount) {

    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
        await ProductStore.update(id, { stock: Math.max(0, Number(product.stock)) + amount });
        await loadProducts();
        showNotification(`${toFaDigits(amount)} عدد به موجودی «${product.name}» اضافه شد`, 'success');
    } catch (err) {
        showNotification(err.message, 'error');
    }

}


// ============================================================
// ===== فرم هوشمند ===========================================
// ============================================================

function initSmartForm() {

    const $ = id => document.getElementById(id);

    // ===== محاسبه‌ی خودکار درصد تخفیف از روی دو قیمت =====
    const onPrices = () => {

        const price = priceNumber($('productPrice').value);
        const oldPrice = priceNumber($('productOldPrice').value);
        const hint = $('priceHint');

        hint.className = 'cg-smart-hint';

        if (price && oldPrice) {

            if (oldPrice > price) {
                const pct = Math.round((1 - price / oldPrice) * 100);
                $('productDiscount').value = `${toFaDigits(pct)}٪`;
                hint.className = 'cg-smart-hint show ok';
                hint.innerHTML = `<i class="fas fa-calculator"></i> تخفیف ${toFaDigits(pct)}٪ به‌صورت خودکار حساب شد (${toFaDigits((oldPrice - price).toLocaleString())} صرفه‌جویی برای مشتری).`;
                if (pct > 70) {
                    hint.className = 'cg-smart-hint show';
                    hint.innerHTML += '<br><i class="fas fa-triangle-exclamation"></i> تخفیف بالای ۷۰٪ غیرعادی است؛ قیمت‌ها را دوباره چک کن.';
                }
            } else {
                $('productDiscount').value = '';
                hint.className = 'cg-smart-hint show';
                hint.innerHTML = '<i class="fas fa-triangle-exclamation"></i> «قیمت قبلی» باید از قیمت فعلی بیشتر باشد تا تخفیف معنی داشته باشد.';
            }

        }

    };

    $('productPrice').addEventListener('input', onPrices);
    $('productOldPrice').addEventListener('input', onPrices);

    // ===== پیشنهاد آیکون مناسب هر دسته =====
    $('productCategory').addEventListener('change', () => {
        const icon = $('productIcon');
        if (!icon.value || Object.values(CATEGORY_ICONS).includes(icon.value)) {
            icon.value = CATEGORY_ICONS[$('productCategory').value] || 'fa-camera-retro';
        }
    });

    // ===== تشخیص دسته از روی نام + هشدار نام تکراری =====
    $('productName').addEventListener('input', () => {

        const name = $('productName').value.trim();
        const id = Number($('productId').value);
        const hint = $('nameHint');

        const guess = guessCategory(name);
        if (guess && !id) {
            $('productCategory').value = guess;
            $('productCategory').dispatchEvent(new Event('change'));
        }

        const duplicate = name && products.find(p => p.id !== id && p.name.trim() === name);

        hint.className = duplicate ? 'cg-smart-hint show' : 'cg-smart-hint';
        hint.innerHTML = duplicate ? `<i class="fas fa-clone"></i> محصولی با همین نام از قبل وجود دارد (#${toFaDigits(duplicate.id)}).` : '';

    });

    // ===== نوشتن خودکار توضیحات =====
    $('autoWriteBtn').addEventListener('click', () => {

        const name = $('productName').value.trim();

        if (!name) {
            showNotification('اول نام محصول را بنویس', 'error');
            $('productName').focus();
            return;
        }

        const { short, long } = generateDescriptions(name, $('productCategory').value);

        $('productDesc').value = short;
        $('productLongDesc').value = long;

        showNotification('توضیحات نوشته شد؛ اگر لازم است ویرایشش کن', 'success');

    });

    // ===== عکس از اینترنت =====
    $('productImageWeb').addEventListener('click', async () => {

        const name = $('productName').value.trim();
        const path = await AdminSmart.pickInternetImage({
            query: AdminSmart.suggestImageQuery(name, $('productCategory').value),
            name: `product-${$('productId').value || 'new'}`
        });

        if (path) {
            selectedImages.push(path);
            renderImageGrid();
            showNotification('عکس دانلود و به محصول اضافه شد (بعد از ذخیره ثبت می‌شود)', 'success');
        }

    });

}


function guessCategory(name) {
    if (/پکیج|package|kit/i.test(name)) return 'package';
    if (/nvr|dvr|ضبط/i.test(name)) return 'nvr';
    if (/کابل|براکت|آداپتور|هارد|منبع|cable|hdd|adapter/i.test(name)) return 'accessory';
    if (/دوربین|camera|bullet|dome|ptz/i.test(name)) return 'camera';
    return '';
}


// ===== ساخت توضیحات کوتاه و کامل از روی کلمات کلیدی نام محصول =====
function generateDescriptions(name, category) {

    const features = [
        [/8K/i, 'کیفیت تصویر فوق‌العاده 8K'],
        [/4K/i, 'تصویر شفاف 4K Ultra HD'],
        [/(\d+)\s*MP/i, m => `وضوح ${toFaDigits(m[1])} مگاپیکسل`],
        [/AI|هوش/i, 'تشخیص هوشمند انسان و خودرو با هوش مصنوعی'],
        [/PTZ|چرخش/i, 'چرخش افقی ۳۵۵ و عمودی ۹۰ درجه'],
        [/وایرلس|wireless|wifi|وای‌فای/i, 'اتصال بی‌سیم WiFi و راه‌اندازی آسان'],
        [/IP67|صنعتی|ضدآب/i, 'بدنه‌ی مقاوم IP67 در برابر آب و گردوغبار'],
        [/۳۶۰|360|پانوراما/i, 'دید پانورامای ۳۶۰ درجه بدون نقطه‌ی کور'],
        [/مخفی|مینیاتوری/i, 'ابعاد بسیار کوچک و نصب نامحسوس'],
        [/doorbell|زنگ/i, 'ارتباط صوتی دوطرفه و اعلان زنگ روی موبایل'],
        [/(\d+|[۰-۹]+)\s*کاناله/, m => `پشتیبانی از ${m[1]} دوربین هم‌زمان`],
        [/(\d+|[۰-۹]+)\s*دوربین/, m => `شامل ${m[1]} دوربین آماده‌ی نصب`],
        [/(\d+|[۰-۹]+)\s*TB/i, m => `ظرفیت ${toFaDigits(m[1])} ترابایت مخصوص ضبط ۲۴ ساعته`],
        [/(\d+|[۰-۹]+)\s*متر/, m => `طول ${m[1]} متر با روکش مقاوم`]
    ];

    const found = features
        .map(([re, text]) => {
            const m = name.match(re);
            return m ? (typeof text === 'function' ? text(m) : text) : null;
        })
        .filter(Boolean);

    const defaults = {
        camera: ['دید در شب تا ۳۰ متر', 'مشاهده‌ی زنده روی موبایل', 'ضبط با فشرده‌سازی H.265'],
        nvr: ['ضبط هم‌زمان همه‌ی کانال‌ها', 'پشتیبانی از هارد تا ۱۰ ترابایت', 'دسترسی از راه دور با اپلیکیشن'],
        package: ['همه‌ی تجهیزات لازم در یک جعبه', 'نصب و راه‌اندازی رایگان', 'مناسب خانه، مغازه و دفتر کار'],
        accessory: ['سازگار با همه‌ی برندهای رایج', 'کیفیت ساخت بالا و عمر طولانی', 'نصب ساده و سریع']
    };

    const all = [...new Set([...found, ...(defaults[category] || defaults.camera)])];

    const short = all.slice(0, 3).join('، ');

    const long = `${name} یکی از گزینه‌های محبوب فروشگاه AMIN SYSTEM است. ${all.slice(0, 5).map(f => `${f}`).join('؛ ')} از مهم‌ترین ویژگی‌های این محصول است. این محصول با ضمانت اصالت کالا، ۲ سال گارانتی و پشتیبانی ۲۴ ساعته عرضه می‌شود و کارشناسان ما برای انتخاب و نصب آن همراه شما هستند.`;

    return { short, long };

}


// ============================================================
// ===== آپلود عکس‌های محصول (چندتایی) =========================
// ============================================================

function initImageUpload() {

    const fileInput = document.getElementById('productImageFile');

    fileInput.addEventListener('change', function () {

        const files = Array.from(fileInput.files || []);

        if (files.length === 0) return;

        Promise.all(files.map(file => compressImage(file, 640, 0.8)))
            .then(dataUrls => {

                selectedImages.push(...dataUrls);
                renderImageGrid();
                fileInput.value = '';

            })
            .catch(() => {

                showNotification('خواندن عکس با مشکل مواجه شد!', 'error');

            });

    });

}


// ===== رندر گرید پیش‌نمایش عکس‌های انتخاب‌شده =====
function renderImageGrid() {

    const grid = document.getElementById('imageGrid');

    grid.innerHTML = selectedImages.map((src, index) => `
        <div class="image-grid-item ${index === 0 ? 'is-main' : ''}">
            <img src="${resolveAsset(src)}" alt="" />
            ${index === 0 ? '<span class="image-main-badge">اصلی</span>' : ''}
            <div class="image-grid-actions">
                ${index !== 0 ? `<button type="button" title="عکس اصلی کن" onclick="setMainImage(${index})"><i class="fas fa-star"></i></button>` : ''}
                <button type="button" title="حذف" onclick="removeSelectedImage(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

}


// ===== حذف یکی از عکس‌های انتخاب‌شده =====
function removeSelectedImage(index) {
    selectedImages.splice(index, 1);
    renderImageGrid();
}


// ===== انتخاب یک عکس دیگر به عنوان عکس اصلی (اول لیست) =====
function setMainImage(index) {
    const [chosen] = selectedImages.splice(index, 1);
    selectedImages.unshift(chosen);
    renderImageGrid();
}


// ===== خواندن فایل + کوچک‌کردن عکس (برای سبک نگه‌داشتن دیتابیس) =====
function compressImage(file, maxWidth, quality) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onerror = reject;

        reader.onload = function () {

            const img = new Image();

            img.onerror = reject;

            img.onload = function () {

                const scale = Math.min(1, maxWidth / img.width);

                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/jpeg', quality));

            };

            img.src = reader.result;

        };

        reader.readAsDataURL(file);

    });

}


// ===== ویرایش محصول =====
async function editProduct(id) {
    const product = await ProductStore.getById(id);
    if (!product) return;

    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDesc').value = product.desc || '';
    document.getElementById('productLongDesc').value = product.longDesc || '';
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOldPrice').value = product.oldPrice || '';
    document.getElementById('productDiscount').value = product.discount || '';
    document.getElementById('productIcon').value = product.icon || 'fa-camera-retro';
    document.getElementById('productCategory').value = product.category || 'camera';
    document.getElementById('productBestseller').checked = !!product.bestseller;
    document.getElementById('productStock').value = product.stock !== undefined && product.stock !== null ? product.stock : 20;

    selectedImages = (Array.isArray(product.images) && product.images.length > 0)
        ? [...product.images]
        : (product.image ? [product.image] : []);

    renderImageGrid();

    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> ویرایش محصول';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> بروزرسانی';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ===== حذف محصول =====
async function deleteProduct(id) {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) return;

    try {
        await ProductStore.remove(id);
        await loadProducts();
        showNotification('محصول با موفقیت حذف شد!', 'success');
    } catch (err) {
        showNotification(err.message || 'حذف با خطا مواجه شد!', 'error');
    }
}


// ===== ریست فرم =====
function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> افزودن محصول جدید';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> ذخیره محصول';
    document.getElementById('productIcon').value = 'fa-camera-retro';
    document.getElementById('productBestseller').checked = false;
    document.getElementById('productStock').value = 20;

    selectedImages = [];
    renderImageGrid();
}


// ===== نوتیفیکیشن =====
function showNotification(message, type = 'success') {
    const notif = document.getElementById('adminNotification');
    notif.textContent = message;
    notif.className = 'admin-notification show ' + type;

    clearTimeout(notif._timeout);
    notif._timeout = setTimeout(() => {
        notif.classList.remove('show');
    }, 3000);
}
