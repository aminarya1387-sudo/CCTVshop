// ============================================================
// AMIN SYSTEM - CART MANAGEMENT
// ============================================================

let cartItems = [];

// ===== بارگذاری سبد از localStorage (برای حفظ سبد بین صفحات) =====
try {
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
        cartItems = JSON.parse(storedCart);
    }
} catch (e) {
    cartItems = [];
}

function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}


// ===== تبدیل اعداد فارسی و عربی به انگلیسی =====
function normalizePrice(value) {

    return String(value)

        // اعداد فارسی
        .replace(/[۰-۹]/g, d =>
            '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)
        )

        // اعداد عربی
        .replace(/[٠-٩]/g, d =>
            '٠١٢٣٤٥٦٧٨٩'.indexOf(d)
        );
}


// ===== ADD TO CART =====
function addToCart(
    id,
    name,
    price,
    icon = 'fa-camera-retro',
    image = null,
    desc = ''
) {

    const existing = cartItems.find(
        item => item.id === id
    );

    if (existing) {

        // اگر محصول قبلاً داخل سبد باشد
        existing.quantity++;

    } else {

        // اگر محصول جدید باشد
        cartItems.push({
            id: id,
            name: name,
            price: price,
            icon: icon,
            image: image,
            desc: desc,
            quantity: 1
        });
    }

    // ذخیره و آپدیت سبد
    saveCart();
    updateCartUI();

    // نمایش پیام
    showNotification(
        `🛒 "${name}" به سبد خرید اضافه شد!`
    );
}


// ===== REMOVE FROM CART =====
function removeFromCart(id) {

    const item = cartItems.find(item => item.id === id);

    cartItems = cartItems.filter(
        item => item.id !== id
    );

    saveCart();
    updateCartUI();

    if (item) {
        showNotification(
            `❌ "${item.name}" از سبد خرید حذف شد!`
        );
    }
}


// ===== تغییر تعداد یک محصول (برای صفحه سبد خرید) =====
function changeQuantity(id, delta) {

    const item = cartItems.find(item => item.id === id);

    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        cartItems = cartItems.filter(i => i.id !== id);
    }

    saveCart();
    updateCartUI();
}


// ===== محاسبه تعداد کل و مجموع قیمت سبد (استفاده مشترک) =====
function getCartTotalCount() {

    return cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

}

function getCartTotalPrice() {

    return cartItems.reduce(
        (sum, item) => {

            const price = parseInt(
                normalizePrice(item.price),
                10
            ) || 0;

            return sum + (price * item.quantity);

        },
        0
    );

}


// ===== UPDATE CART UI =====
function updateCartUI() {

    const badge =
        document.querySelector('.badge');

    const cartItemsContainer =
        document.getElementById('cartItems');

    const cartCount =
        document.querySelector('.cart-count');

    const totalPrice =
        document.querySelector('.total-price');


    // ========================================================
    // محاسبه تعداد کل محصولات
    // ========================================================

    const totalCount = getCartTotalCount();


    // نمایش تعداد روی آیکون سبد
    if (badge) {

        badge.innerText = totalCount;

    }


    // انیمیشن badge
    if (totalCount > 0 && badge) {

        badge.classList.add('bounce');

        setTimeout(() => {
            badge.classList.remove('bounce');
        }, 400);

    }


    // نمایش تعداد داخل هدر سبد
    if (cartCount) {

        cartCount.innerText =
            totalCount === 0
                ? '۰ محصول'
                : `${totalCount} محصول`;

    }


    // ========================================================
    // محاسبه مجموع قیمت
    // ========================================================

    const total = getCartTotalPrice();


    // نمایش مجموع
    if (totalPrice) {

        totalPrice.innerText =
            `${total.toLocaleString('fa-IR')} تومان`;

    }


    // ========================================================
    // نمایش محصولات داخل سبد
    // ========================================================

    if (cartItemsContainer) {

        // اگر سبد خالی باشد
        if (cartItems.length === 0) {

            cartItemsContainer.innerHTML = `
                <div class="cart-empty">

                    <i class="fas fa-box-open"></i>

                    <p>
                        سبد خرید شما خالی است
                    </p>

                </div>
            `;

        }

        // اگر محصول داخل سبد باشد
        else {

            cartItemsContainer.innerHTML =
                cartItems.map(item => `

                    <div class="cart-item">

                        <div class="item-icon">
                            ${productMedia(item)}
                        </div>

                        <div class="item-info">

                            <h5>
                                ${item.name}
                            </h5>

                            <span class="item-price">
                                ${item.price} تومان × ${item.quantity}
                            </span>

                        </div>

                        <span
                            class="item-remove"
                            onclick="removeFromCart(${item.id})"
                        >
                            <i class="fas fa-times"></i>
                        </span>

                    </div>

                `).join('');

        }

    }


    // اگر صفحه سبد خرید کامل (pages/cart.html) باز باشد، آن را هم آپدیت کن
    renderFullCartPage();

}


// ============================================================
// ===== صفحه کامل سبد خرید (pages/cart.html) =================
// ============================================================

function renderFullCartPage() {

    const container = document.getElementById('fullCartItems');

    if (!container) return;

    const summaryTotal = document.getElementById('fullCartTotal');
    const summaryCount = document.getElementById('fullCartCount');
    const checkoutBtn = document.getElementById('goToCheckoutBtn');
    const emptyState = document.getElementById('fullCartEmpty');

    const totalCount = getCartTotalCount();
    const total = getCartTotalPrice();

    if (summaryTotal) {
        summaryTotal.innerText = `${total.toLocaleString('fa-IR')} تومان`;
    }

    if (summaryCount) {
        summaryCount.innerText = `${totalCount} کالا`;
    }

    if (checkoutBtn) {
        checkoutBtn.classList.toggle('disabled', cartItems.length === 0);
    }

    if (cartItems.length === 0) {

        container.innerHTML = '';

        if (emptyState) {
            emptyState.style.display = 'block';
        }

        return;

    }

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    container.innerHTML = cartItems.map(item => {

        const unitPrice = parseInt(normalizePrice(item.price), 10) || 0;
        const rowTotal = unitPrice * item.quantity;

        return `
            <div class="full-cart-item">

                <div class="item-icon">
                    ${productMedia(item)}
                </div>

                <div class="item-info">
                    <h5>${item.name}</h5>
                    <span class="item-price">${item.price} تومان</span>
                </div>

                <div class="qty-stepper">
                    <button onclick="changeQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                </div>

                <div class="row-total">
                    ${rowTotal.toLocaleString('fa-IR')} تومان
                </div>

                <span class="item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </span>

            </div>
        `;

    }).join('');

}


// ============================================================
// ===== NOTIFICATION ==========================================
// ============================================================

function showNotification(message) {

    const old =
        document.querySelector(
            '.custom-notification'
        );

    if (old) {
        old.remove();
    }


    const notif =
        document.createElement('div');

    notif.className =
        'custom-notification';

    notif.innerHTML =
        message;

    document.body.appendChild(notif);


    setTimeout(() => {

        notif.style.opacity = '1';

        notif.style.transform =
            'translateY(0)';

    }, 100);


    setTimeout(() => {

        notif.style.opacity = '0';

        notif.style.transform =
            'translateY(-20px)';

        setTimeout(() => {

            notif.remove();

        }, 400);

    }, 3000);

}


// ===== نمایش سبد ذخیره‌شده هنگام باز شدن صفحه =====
updateCartUI();
