// ============================================================
// AMIN SYSTEM - DISCOUNT SLIDER
// ============================================================

const slider = document.getElementById('discountSlider');
let edgeScrollInterval = null;

slider.addEventListener('mousemove', (e) => {
    const rect = slider.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const edgeThreshold = 60;
    const scrollSpeed = 8;

    if (edgeScrollInterval) {
        clearInterval(edgeScrollInterval);
    }

    if (mouseX < edgeThreshold) {
        edgeScrollInterval = setInterval(() => {
            slider.scrollBy({
                left: -scrollSpeed,
                behavior: 'smooth'
            });
        }, 20);

        slider.style.cursor = 'w-resize';

    } else if (mouseX > rect.width - edgeThreshold) {
        edgeScrollInterval = setInterval(() => {
            slider.scrollBy({
                left: scrollSpeed,
                behavior: 'smooth'
            });
        }, 20);

        slider.style.cursor = 'e-resize';

    } else {
        slider.style.cursor = 'default';
    }
});

slider.addEventListener('mouseleave', () => {
    if (edgeScrollInterval) {
        clearInterval(edgeScrollInterval);
    }

    slider.style.cursor = 'default';
});

document.getElementById('scrollToEndBtn').addEventListener('click', () => {
    slider.scrollTo({
        left: slider.scrollWidth,
        behavior: 'smooth'
    });
});


// ===== BUILD SLIDER (از ProductStore، فلگ discounted) =====
async function buildSlider() {
    slider.innerHTML = '';

    const all = await ProductStore.getAll();

    const discountProducts = all.filter(p => p.discounted);

    discountProducts.forEach(p => {
        const div = document.createElement('div');

        div.className = 'slider-item';

        div.innerHTML = `
            <div class="product-img">
                ${productMedia(p)}
            </div>

            <h4>${p.name}</h4>

            <div class="price">
                ${p.oldPrice ? `<del>$${p.oldPrice}</del>` : ''}
                $${p.price}
            </div>

            <span class="discount-tag">
                🔥 ${p.discount} تخفیف
            </span>

            <button class="slider-quick-add" title="افزودن به سبد">
                <i class="fas fa-cart-plus"></i>
            </button>
        `;

        // کلیک روی کارت -> صفحه جزئیات محصول
        div.addEventListener('click', () => {
            location.href = `pages/product.html?id=${p.id}`;
        });

        // دکمه افزودن سریع به سبد (بدون رفتن به صفحه جزئیات)
        div.querySelector('.slider-quick-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(p.id, p.name, p.price, p.icon, p.image, p.desc);
        });

        slider.appendChild(div);
    });
}

buildSlider();
