// ============================================================
// AMIN SYSTEM - CHECKOUT PAGE
// ثبت سفارش نیاز به ورود با حساب کاربری دارد (customer-auth.js)
// ============================================================

// ===== اگر لاگین نیست، اول بفرست به صفحه ورود/ثبت‌نام =====
async function requireCustomerLogin() {

    const session = await CustomerAuth.getSession();

    if (!session) {
        location.href = 'account.html?redirect=checkout.html';
        return null;
    }

    // ===== پیش‌پر کردن نام/موبایل از روی حساب کاربری =====
    const nameField = document.getElementById('custName');
    const phoneField = document.getElementById('custPhone');

    if (nameField && !nameField.value) nameField.value = session.name;
    if (phoneField && !phoneField.value) phoneField.value = session.phone;

    return session;

}

// ===== رندر خلاصه سفارش =====
function renderCheckoutSummary() {

    const list = document.getElementById('checkoutItems');
    const totalEl = document.getElementById('checkoutTotal');
    const countEl = document.getElementById('checkoutCount');

    if (!list) return;

    if (cartItems.length === 0) {

        list.innerHTML = `
            <div class="full-cart-empty" style="padding:30px 10px;">
                <i class="fas fa-box-open"></i>
                <p>سبد خرید شما خالی است</p>
                <a href="products.html" class="btn-shop-now">
                    <i class="fas fa-th-list"></i>
                    مشاهده محصولات
                </a>
            </div>
        `;

        const form = document.getElementById('checkoutForm');
        if (form) form.style.display = 'none';

        if (totalEl) totalEl.innerText = '۰ تومان';
        if (countEl) countEl.innerText = '۰ کالا';

        return;

    }

    list.innerHTML = cartItems.map(item => {

        const unitPrice = parseInt(normalizePrice(item.price), 10) || 0;
        const rowTotal = unitPrice * item.quantity;

        return `
            <div class="checkout-row">
                <span class="checkout-row-name">
                    <i class="fas ${item.icon}"></i>
                    ${item.name} × ${item.quantity}
                </span>
                <span class="checkout-row-price">${rowTotal.toLocaleString('fa-IR')} تومان</span>
            </div>
        `;

    }).join('');

    if (totalEl) {
        totalEl.innerText = `${getCartTotalPrice().toLocaleString('fa-IR')} تومان`;
    }

    if (countEl) {
        countEl.innerText = `${getCartTotalCount()} کالا`;
    }

}


// ===== ثبت سفارش (کد سفارش را خودِ سرور تولید می‌کند) =====
function initCheckoutForm() {

    const form = document.getElementById('checkoutForm');

    if (!form) return;

    form.addEventListener('submit', async function(e) {

        e.preventDefault();

        if (cartItems.length === 0) {
            showNotification('سبد خرید شما خالی است!');
            return;
        }

        const paymentMethod =
            document.querySelector('input[name="payment"]:checked')?.value || 'cod';

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {

            // ===== ذخیره سفارش روی سرور واقعی =====
            const order = await OrderStore.add({
                customer: {
                    name: document.getElementById('custName').value.trim(),
                    phone: document.getElementById('custPhone').value.trim(),
                    city: document.getElementById('custCity').value.trim(),
                    address: document.getElementById('custAddress').value.trim()
                },
                payment: paymentMethod,
                items: cartItems.map(item => ({ ...item })),
                totalCount: getCartTotalCount(),
                totalPrice: getCartTotalPrice()
            });

            document.getElementById('orderNumberText').innerText = order.orderNumber;

            document.getElementById('checkoutFormSection').style.display = 'none';
            document.getElementById('orderSuccess').style.display = 'block';

            // خالی کردن سبد خرید پس از ثبت سفارش
            cartItems = [];
            saveCart();
            updateCartUI();

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {

            showNotification(err.message || 'ثبت سفارش با خطا مواجه شد!');

        } finally {

            if (submitBtn) submitBtn.disabled = false;

        }

    });

}


requireCustomerLogin();
renderCheckoutSummary();
initCheckoutForm();
