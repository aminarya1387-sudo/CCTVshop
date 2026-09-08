// ============================================================
// AMIN SYSTEM - PRODUCTS (PACKAGES / CATEGORIES / BESTSELLERS)
// ============================================================

// ===== تبدیل عدد انگلیسی به رقم فارسی (برای نمایش تعداد محصولات) =====
function toPersianDigits(num) {
    const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(num).replace(/[0-9]/g, d => persianDigits[d]);
}


// ===== BUILD PACKAGES (از ProductStore، دسته «package») =====
async function buildPackages() {
    const container = document.getElementById('packageGrid');

    if (!container) return;

    container.innerHTML = '';

    const all = await ProductStore.getAll();

    const packages = all.filter(p => p.category === 'package');

    packages.forEach(p => {
        const div = document.createElement('div');

        div.className = 'package-item';

        div.style.cursor = 'pointer';

        div.addEventListener('click', () => {
            location.href = `pages/product.html?id=${p.id}`;
        });

        const badgeText = p.bestseller
            ? 'پرفروش'
            : (p.discounted ? 'تخفیف ویژه' : 'جدید');

        div.innerHTML = `
            <div class="package-badge">
                ${badgeText}
            </div>

            <div class="package-img">
                ${productMedia(p)}
            </div>

            <h4>${p.name}</h4>

            <div class="package-desc">
                ${p.desc}
            </div>

            <div class="package-price">
                <span class="price-new">
                    $${p.price}
                </span>

                ${p.oldPrice ? `<del>$${p.oldPrice}</del>` : ''}
            </div>

            <button class="package-btn">
                <i class="fas fa-cart-plus"></i>
                مشاهده پکیج
            </button>
        `;

        div.querySelector('.package-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(p.id, p.name, p.price, p.icon, p.image, p.desc);
        });

        container.appendChild(div);
    });
}


// ===== BUILD CATEGORIES (از categories در data/categories.js) =====
async function buildCategories() {
    const container = document.getElementById('categoryGrid');

    if (!container) return;

    container.innerHTML = '';

    const counts = await ProductStore.getCategoryCounts();

    categories.forEach((cat, index) => {
        const div = document.createElement('div');

        div.className = 'category-item';

        div.style.animationDelay = `${index * 0.1}s`;

        div.innerHTML = `
            <a href="${cat.link}" class="category-link">

                <div
                    class="category-icon"
                    style="
                        background:${cat.bgColor};
                        color:${cat.color};
                    "
                >
                    <i class="fas ${cat.icon}"></i>
                </div>

                <div class="category-info">

                    <span class="category-name">
                        ${cat.name}
                    </span>

                    <span class="category-count">
                        ${toPersianDigits(counts[cat.categoryKey] || 0)} محصول
                    </span>

                </div>

            </a>
        `;

        container.appendChild(div);
    });
}


// ===== BUILD BESTSELLERS (از ProductStore، فلگ bestseller) =====
async function buildBestsellers() {
    const grid = document.getElementById('bestsellerGrid');

    if (!grid) return;

    grid.innerHTML = '';

    const all = await ProductStore.getAll();

    const bestsellers = all.filter(p => p.bestseller);

    bestsellers.forEach((p, index) => {

        const div = document.createElement('div');

        div.className = 'bestseller-item';

        div.style.cursor = 'pointer';

        div.style.animationDelay = `${index * 0.08}s`;

        div.addEventListener('click', () => {
            location.href = `pages/product.html?id=${p.id}`;
        });

        const rank = index + 1;

        let rankDisplay = '';

        if (rank === 1) {
            rankDisplay = '🥇';
        } else if (rank === 2) {
            rankDisplay = '🥈';
        } else if (rank === 3) {
            rankDisplay = '🥉';
        } else {
            rankDisplay = `#${rank}`;
        }

        div.innerHTML = `
            <div class="bs-rank">
                ${rankDisplay}
            </div>

            <div class="bs-info">

                <h4>
                    ${p.name}
                </h4>

                <div class="bs-desc">
                    ${p.desc}
                </div>

                <div class="bs-price">

                    <span class="price-new">
                        $${p.price}
                    </span>

                    ${p.oldPrice ? `<del>$${p.oldPrice}</del>` : ''}

                </div>

                <button class="bs-btn">
                    <i class="fas fa-cart-plus"></i>
                    افزودن به سبد
                </button>

            </div>

            <div class="bs-img">
                ${productMedia(p)}
            </div>
        `;

        div.querySelector('.bs-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(p.id, p.name, p.price, p.icon, p.image, p.desc);
        });

        grid.appendChild(div);
    });
}


// ============================================================
// ===== TOOLTIP HELPERS ======================================
// ============================================================

function createTooltip(
    content,
    type = 'default'
) {

    const tooltip =
        document.createElement('div');

    tooltip.className =
        `product-tooltip ${type}-tip`;

    tooltip.innerHTML =
        content;

    document.body.appendChild(
        tooltip
    );

    return tooltip;
}


function positionTooltip(
    tooltip,
    e
) {

    let x =
        e.clientX + 25;

    let y =
        e.clientY - 10;


    const w =
        tooltip.offsetWidth || 320;

    const h =
        tooltip.offsetHeight || 260;


    const maxX =
        window.innerWidth -
        w -
        15;

    const maxY =
        window.innerHeight -
        h -
        15;


    x =
        Math.max(
            15,
            Math.min(x, maxX)
        );

    y =
        Math.max(
            15,
            Math.min(y, maxY)
        );


    if (
        e.clientX >
        window.innerWidth / 2
    ) {

        x =
            e.clientX -
            w -
            25;

    }


    tooltip.style.left =
        x + 'px';

    tooltip.style.top =
        y + 'px';

}


// ============================================================
// PACKAGE TOOLTIPS (بعد از ساخته‌شدن کارت‌های پکیج صدا زده می‌شود)
// ============================================================

function wirePackageTooltips() {

    document
        .querySelectorAll('.package-item')
        .forEach(item => {

            let tooltip = null;


            item.addEventListener(
                'mouseenter',
                function(e) {

                    const name =
                        this.querySelector('h4')
                            ?.innerText || '';


                    const desc =
                        this.querySelector('.package-desc')
                            ?.innerText || '';


                    const price =
                        this.querySelector('.price-new')
                            ?.innerText || '';


                    const oldPrice =
                        this.querySelector('del')
                            ?.innerText || '';


                    const badge =
                        this.querySelector('.package-badge')
                            ?.innerText || '';


                    const content = `

                        <div class="tooltip-header">

                            <h4>
                                <i class="fas fa-box"></i>
                                ${name}
                            </h4>

                            ${
                                badge
                                    ? `
                                        <span class="tooltip-badge">
                                            🏷️ ${badge}
                                        </span>
                                    `
                                    : ''
                            }

                        </div>


                        <div class="tooltip-body">

                            <div class="tooltip-desc">
                                ${desc}
                            </div>


                            <div class="tooltip-specs-grid">

                                <div class="spec-item">
                                    <i class="fas fa-check-circle"></i>
                                    گارانتی:
                                    <span class="spec-value">
                                        ۲ ساله
                                    </span>
                                </div>

                                <div class="spec-item">
                                    <i class="fas fa-tools"></i>
                                    نصب:
                                    <span class="spec-value">
                                        رایگان
                                    </span>
                                </div>

                                <div class="spec-item">
                                    <i class="fas fa-headset"></i>
                                    پشتیبانی:
                                    <span class="spec-value">
                                        ۲۴/۷
                                    </span>
                                </div>

                            </div>


                            <div class="tooltip-price">

                                <span class="price-current">
                                    <i class="fas fa-dollar-sign"></i>
                                    ${price}
                                </span>

                                ${
                                    oldPrice
                                        ? `
                                            <span class="price-old">
                                                ${oldPrice}
                                            </span>
                                        `
                                        : ''
                                }

                                <span class="price-discount">
                                    🔥 تخفیف ویژه
                                </span>

                            </div>


                            <div class="tooltip-tags">

                                <span class="tag tag-gold">
                                    <i class="fas fa-star"></i>
                                    پرفروش
                                </span>

                                <span class="tag tag-blue">
                                    <i class="fas fa-shield-alt"></i>
                                    اصل
                                </span>

                            </div>

                        </div>

                    `;


                    tooltip =
                        createTooltip(
                            content,
                            'package'
                        );


                    positionTooltip(
                        tooltip,
                        e
                    );

                }
            );


            item.addEventListener(
                'mousemove',
                function(e) {

                    if (tooltip) {

                        positionTooltip(
                            tooltip,
                            e
                        );

                    }

                }
            );


            item.addEventListener(
                'mouseleave',
                function() {

                    if (tooltip) {

                        tooltip.remove();

                        tooltip = null;

                    }

                }
            );

        });

}


// ============================================================
// BESTSELLER TOOLTIPS (بعد از ساخته‌شدن کارت‌های پرفروش صدا زده می‌شود)
// ============================================================

function wireBestsellerTooltips() {

    document
        .querySelectorAll('.bestseller-item')
        .forEach(item => {

            let tooltip = null;


            item.addEventListener(
                'mouseenter',
                function(e) {

                    const name =
                        this.querySelector('h4')
                            ?.innerText || '';


                    const desc =
                        this.querySelector('.bs-desc')
                            ?.innerText || '';


                    const price =
                        this.querySelector('.price-new')
                            ?.innerText || '';


                    const oldPrice =
                        this.querySelector('del')
                            ?.innerText || '';


                    const rank =
                        this.querySelector('.bs-rank')
                            ?.innerText || '';


                    const content = `

                        <div class="tooltip-header">

                            <h4>
                                <i class="fas fa-trophy"></i>
                                ${name}
                            </h4>

                            <span class="tooltip-badge">
                                ${rank} پرفروش‌ترین
                            </span>

                        </div>


                        <div class="tooltip-body">

                            <div class="tooltip-desc">
                                ${desc}
                            </div>


                            <div class="tooltip-specs-grid">

                                <div class="spec-item">
                                    <i class="fas fa-video"></i>
                                    کیفیت:
                                    <span class="spec-value">
                                        4K Ultra
                                    </span>
                                </div>

                                <div class="spec-item">
                                    <i class="fas fa-moon"></i>
                                    دید در شب:
                                    <span class="spec-value">
                                        ۵۰ متر
                                    </span>
                                </div>

                                <div class="spec-item">
                                    <i class="fas fa-water"></i>
                                    مقاومت:
                                    <span class="spec-value">
                                        IP67
                                    </span>
                                </div>

                            </div>


                            <div class="tooltip-price">

                                <span class="price-current">

                                    <i class="fas fa-dollar-sign"></i>

                                    ${price}

                                </span>


                                ${
                                    oldPrice
                                        ? `
                                            <span class="price-old">
                                                ${oldPrice}
                                            </span>
                                        `
                                        : ''
                                }


                                <span class="price-discount">
                                    ⭐ ویژه
                                </span>

                            </div>


                            <div class="tooltip-tags">

                                <span class="tag tag-gold">
                                    <i class="fas fa-crown"></i>
                                    پرفروش
                                </span>

                                <span class="tag tag-blue">
                                    <i class="fas fa-shield-alt"></i>
                                    ۲ سال گارانتی
                                </span>

                            </div>

                        </div>

                    `;


                    tooltip =
                        createTooltip(
                            content,
                            'bestseller'
                        );


                    positionTooltip(
                        tooltip,
                        e
                    );

                }
            );


            item.addEventListener(
                'mousemove',
                function(e) {

                    if (tooltip) {

                        positionTooltip(
                            tooltip,
                            e
                        );

                    }

                }
            );


            item.addEventListener(
                'mouseleave',
                function() {

                    if (tooltip) {

                        tooltip.remove();

                        tooltip = null;

                    }

                }
            );

        });

}


// ============================================================
// ===== شروع: ساخت همه بخش‌ها به‌ترتیب، بعد وصل‌کردن تولتیپ‌ها =====
// ============================================================

(async function init() {

    await buildPackages();
    await buildCategories();
    await buildBestsellers();

    wirePackageTooltips();
    wireBestsellerTooltips();

})();
