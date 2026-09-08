// ============================================================
// AMIN SYSTEM - PRODUCT DETAIL PAGE
// ============================================================

const detailCategoryLabels = {
    camera: 'دوربین‌ها',
    nvr: 'NVR / DVR',
    package: 'پکیج‌های کامل',
    accessory: 'تجهیزات جانبی'
};


// ===== ساخت توضیحات تکمیلی پیش‌فرض (اگر محصول longDesc نداشته باشد) =====
function buildLongDescription(p) {

    if (p.longDesc && p.longDesc.trim()) {
        return p.longDesc;
    }

    return `${p.desc}. «${p.name}» یکی از محصولات دسته «${detailCategoryLabels[p.category]}» فروشگاه AMIN SYSTEM است که با استانداردهای بالای کیفیت ساخته شده و برای استفاده در پروژه‌های خانگی، اداری و تجاری مناسب است. این محصول با گارانتی ۲ ساله و پشتیبانی ۲۴ ساعته عرضه می‌شود و نصب آن توسط تیم فنی ما به‌صورت رایگان انجام می‌گیرد.`;

}


function renderProductNotFound() {

    document.getElementById('productDetailRoot').innerHTML = `
        <div class="catalog-empty" style="padding:80px 20px;">
            <i class="fas fa-box-open"></i>
            <p>این محصول پیدا نشد یا حذف شده است.</p>
        </div>
    `;

    document.title = 'محصول یافت نشد | AMIN SYSTEM';

}


async function renderProductDetail() {

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));

    const product = await ProductStore.getById(id);

    if (!product) {
        renderProductNotFound();
        return;
    }

    document.title = `${product.name} | AMIN SYSTEM`;

    const metaDesc = document.getElementById('metaDescription');
    if (metaDesc) {
        metaDesc.setAttribute('content', `${product.name} - ${product.desc} | خرید با گارانتی از فروشگاه AMIN SYSTEM`);
    }


    // ===== breadcrumb =====
    document.getElementById('breadcrumbName').innerText = product.name;


    // ===== محتوای اصلی =====
    document.getElementById('productDetailRoot').innerHTML = `

        <div class="product-detail">

            <div class="product-gallery">
                ${productGalleryMedia(product)}
            </div>

            <div class="product-info">

                <div class="product-tags-row">
                    <span class="catalog-category">${detailCategoryLabels[product.category]}</span>
                    ${product.stock <= 0 ? '<span class="catalog-badge out-of-stock">ناموجود</span>' : ''}
                    ${product.discounted ? '<span class="catalog-badge discount">🔥 ' + product.discount + ' تخفیف</span>' : ''}
                    ${product.bestseller ? '<span class="catalog-badge bestseller">⭐ پرفروش</span>' : ''}
                </div>

                <h1>${product.name}</h1>

                <p class="product-short-desc">${product.desc}</p>

                <div class="product-price-block">
                    <span class="price-new">$${product.price}</span>
                    ${product.oldPrice ? `<del>$${product.oldPrice}</del>` : ''}
                </div>

                <div class="product-actions">
                    <button class="catalog-btn" id="addToCartMainBtn" ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas ${product.stock <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                        ${product.stock <= 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
                    </button>
                </div>

                <div class="trust-badges">
                    <div class="trust-badge">
                        <i class="fas fa-check-circle"></i>
                        <span>گارانتی ۲ ساله</span>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-tools"></i>
                        <span>نصب رایگان</span>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-headset"></i>
                        <span>پشتیبانی ۲۴/۷</span>
                    </div>
                </div>

            </div>

        </div>

        <div class="description-section" style="margin-top:40px;">
            <h2><i class="fas fa-align-right"></i> توضیحات تکمیلی</h2>
            <p class="description-text">${buildLongDescription(product)}</p>
        </div>

    `;


    initProductGalleryThumbs(document.getElementById('productDetailRoot'));

    document.getElementById('addToCartMainBtn').addEventListener('click', () => {
        addToCart(product.id, product.name, product.price, product.icon, product.image, product.desc);
    });


    await renderRelatedProducts(product);

}


// ===== محصولات مرتبط (همان دسته‌بندی) =====
async function renderRelatedProducts(product) {

    const section = document.getElementById('relatedSection');
    const grid = document.getElementById('relatedGrid');

    if (!section || !grid) return;

    const all = await ProductStore.getAll();

    const related = all
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    if (related.length === 0) {
        section.style.display = 'none';
        return;
    }

    grid.innerHTML = related.map(p => `
        <div class="catalog-card" data-id="${p.id}">

            <div class="catalog-tags">
                ${p.discounted ? '<span class="catalog-badge discount">🔥 ' + p.discount + '</span>' : ''}
                ${p.bestseller ? '<span class="catalog-badge bestseller">⭐ پرفروش</span>' : ''}
            </div>

            <span class="catalog-category">
                ${detailCategoryLabels[p.category]}
            </span>

            <div class="catalog-img">
                ${productMedia(p)}
            </div>

            <h4>${p.name}</h4>

            <div class="catalog-desc">
                ${p.desc}
            </div>

            <div class="catalog-price">
                <span class="price-new">$${p.price}</span>
                ${p.oldPrice ? `<del>$${p.oldPrice}</del>` : ''}
            </div>

            <button class="catalog-btn" data-id="${p.id}">
                <i class="fas fa-cart-plus"></i>
                افزودن به سبد
            </button>

        </div>
    `).join('');

    grid.querySelectorAll('.catalog-card').forEach(card => {

        const p = related.find(x => x.id === Number(card.dataset.id));

        card.addEventListener('click', () => {
            location.href = `product.html?id=${p.id}`;
        });

        card.querySelector('.catalog-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(p.id, p.name, p.price, p.icon, p.image, p.desc);
        });

    });

}


renderProductDetail();
