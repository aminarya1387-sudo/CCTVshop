// ============================================================
// AMIN SYSTEM - CATALOG PAGE (فیلتر و نمایش همه محصولات)
// ============================================================

const categoryLabels = {
    all: 'همه محصولات',
    camera: 'دوربین‌ها',
    nvr: 'NVR / DVR',
    package: 'پکیج‌های کامل',
    accessory: 'تجهیزات جانبی'
};

// ===== خواندن فیلتر اولیه از URL (؟cat=camera&filter=discount) =====
const urlParams = new URLSearchParams(window.location.search);

const catalogState = {
    category: urlParams.get('cat') || 'all',
    discountOnly: urlParams.get('filter') === 'discount',
    bestsellerOnly: urlParams.get('filter') === 'bestseller',
    query: urlParams.get('q') || ''
};


// ===== ساخت نوار فیلتر =====
function buildFilterBar() {

    const categoryGroup = document.getElementById('categoryFilterGroup');

    if (categoryGroup) {

        categoryGroup.innerHTML = Object.keys(categoryLabels).map(key => `
            <button
                class="filter-chip cat-chip ${catalogState.category === key ? 'active' : ''}"
                data-cat="${key}"
            >
                ${categoryLabels[key]}
            </button>
        `).join('');

        categoryGroup.querySelectorAll('.cat-chip').forEach(btn => {

            btn.addEventListener('click', function() {

                catalogState.category = this.dataset.cat;

                syncFilterBar();

                renderCatalog();

            });

        });

    }


    const discountChip = document.getElementById('discountChip');
    const bestsellerChip = document.getElementById('bestsellerChip');

    if (discountChip) {

        discountChip.addEventListener('click', function() {

            catalogState.discountOnly = !catalogState.discountOnly;

            syncFilterBar();

            renderCatalog();

        });

    }

    if (bestsellerChip) {

        bestsellerChip.addEventListener('click', function() {

            catalogState.bestsellerOnly = !catalogState.bestsellerOnly;

            syncFilterBar();

            renderCatalog();

        });

    }


    const searchInput = document.getElementById('catalogSearchInput');

    if (searchInput) {

        searchInput.value = catalogState.query;

        searchInput.addEventListener('input', function() {

            catalogState.query = this.value.trim();

            syncFilterBar();

            renderCatalog();

        });

    }

    syncFilterBar();

}


// ===== هماهنگ‌سازی ظاهر فیلترها با state =====
function syncFilterBar() {

    document.querySelectorAll('.cat-chip').forEach(btn => {

        btn.classList.toggle(
            'active',
            btn.dataset.cat === catalogState.category
        );

    });

    const discountChip = document.getElementById('discountChip');
    const bestsellerChip = document.getElementById('bestsellerChip');

    if (discountChip) {
        discountChip.classList.toggle('active', catalogState.discountOnly);
    }

    if (bestsellerChip) {
        bestsellerChip.classList.toggle('active', catalogState.bestsellerOnly);
    }


    // آپدیت آدرس صفحه بدون رفرش
    const params = new URLSearchParams();

    if (catalogState.category !== 'all') {
        params.set('cat', catalogState.category);
    }

    if (catalogState.discountOnly) {
        params.set('filter', 'discount');
    } else if (catalogState.bestsellerOnly) {
        params.set('filter', 'bestseller');
    }

    if (catalogState.query) {
        params.set('q', catalogState.query);
    }

    const query = params.toString();

    history.replaceState(
        null,
        '',
        query ? `?${query}` : window.location.pathname
    );

}


// ===== فیلتر کردن محصولات =====
async function getFilteredProducts() {

    const all = await ProductStore.getAll();

    return all.filter(p => {

        if (
            catalogState.category !== 'all' &&
            p.category !== catalogState.category
        ) {
            return false;
        }

        if (catalogState.discountOnly && !p.discounted) {
            return false;
        }

        if (catalogState.bestsellerOnly && !p.bestseller) {
            return false;
        }

        if (catalogState.query) {

            const q = catalogState.query.toLowerCase();

            const matchesName = p.name.toLowerCase().includes(q);
            const matchesDesc = (p.desc || '').toLowerCase().includes(q);

            if (!matchesName && !matchesDesc) {
                return false;
            }

        }

        return true;

    });

}


// ===== رندر گرید محصولات =====
async function renderCatalog() {

    const grid = document.getElementById('catalogGrid');
    const countEl = document.getElementById('resultCount');

    if (!grid) return;

    const list = await getFilteredProducts();

    if (countEl) {
        countEl.innerText = `${list.length} محصول`;
    }

    if (list.length === 0) {

        grid.innerHTML = `
            <div class="catalog-empty">
                <i class="fas fa-box-open"></i>
                <p>محصولی با این فیلتر یافت نشد</p>
            </div>
        `;

        return;

    }

    grid.innerHTML = list.map(p => `
        <div class="catalog-card" data-id="${p.id}">

            <div class="catalog-tags">
                ${p.stock <= 0 ? '<span class="catalog-badge out-of-stock">ناموجود</span>' : ''}
                ${p.discounted ? '<span class="catalog-badge discount">🔥 ' + p.discount + '</span>' : ''}
                ${p.bestseller ? '<span class="catalog-badge bestseller">⭐ پرفروش</span>' : ''}
            </div>

            <span class="catalog-category">
                ${categoryLabels[p.category]}
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

            <button class="catalog-btn" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
                <i class="fas ${p.stock <= 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                ${p.stock <= 0 ? 'ناموجود' : 'افزودن به سبد'}
            </button>

        </div>
    `).join('');

    grid.querySelectorAll('.catalog-card').forEach(card => {

        const p = list.find(x => x.id === Number(card.dataset.id));

        card.addEventListener('click', () => {
            location.href = `product.html?id=${p.id}`;
        });

        card.querySelector('.catalog-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (p.stock <= 0) return;
            addToCart(p.id, p.name, p.price, p.icon, p.image, p.desc);
        });

    });

}


buildFilterBar();
renderCatalog();
