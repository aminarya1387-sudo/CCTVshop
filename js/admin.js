// ============================================================
// AMIN SYSTEM - ADMIN PANEL / PRODUCTS
// (از ProductStore مشترک استفاده می‌کند که حالا با fetch به
//  بک‌اند واقعی وصل است؛ همه توابع async هستند)
// ============================================================

let products = [];
let selectedImages = [];

(async function init() {

    const adminSession = await renderAdminSidebar('products');

    // اگر گارد ورود ریدایرکت کرد، بقیه کد اجرا نشود
    if (adminSession) {
        initProductsPage();
    }

})();


function initProductsPage() {

    loadProducts();
    initImageUpload();

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


// ===== رندر جدول =====
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    const empty = document.getElementById('tableEmpty');

    if (products.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = products.map((p, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${
                p.image
                    ? `<img class="product-thumb" src="${resolveAsset(p.image)}" alt="" />`
                    : `<i class="fas ${p.icon} product-icon"></i>`
            }</td>
            <td>${p.name}</td>
            <td><span class="product-badge ${p.category}">${getCategoryName(p.category)}</span></td>
            <td>${p.price} هزار</td>
            <td>${p.discount || '-'}</td>
            <td>
                <span class="stock-badge ${p.stock <= 0 ? 'out' : (p.stock <= 5 ? 'low' : '')}">
                    ${p.stock <= 0 ? 'ناموجود' : p.stock}
                </span>
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
    `).join('');
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
    document.getElementById('productCount').textContent = `${products.length} محصول`;
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
