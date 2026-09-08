// ============================================================
// AMIN SYSTEM - ACCOUNT PAGE (ورود / ثبت‌نام مشتری)
// ============================================================

// ===== آدرس بازگشت بعد از ورود موفق (مثلاً از تسویه‌حساب فرستاده شده) =====
function getAccountRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '../index.html';
}


// ===== اگر از قبل لاگین بود، مستقیم به مقصد برو =====
async function redirectIfAlreadyLoggedIn() {

    const session = await CustomerAuth.getSession();

    if (session) {
        location.href = getAccountRedirectTarget();
    }

}


// ===== تب‌های ورود / ثبت‌نام =====
function initAccountTabs() {

    const tabs = document.querySelectorAll('.account-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    tabs.forEach(tab => {

        tab.addEventListener('click', () => {

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'login') {
                loginForm.style.display = 'flex';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'flex';
            }

        });

    });

}


// ===== فرم ورود =====
function initLoginForm() {

    const form = document.getElementById('loginForm');
    const errorBox = document.getElementById('loginError');

    if (!form) return;

    form.addEventListener('submit', async function (e) {

        e.preventDefault();

        errorBox.classList.remove('show');

        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPass').value;

        try {

            await CustomerAuth.login(phone, password);

            location.href = getAccountRedirectTarget();

        } catch (err) {

            errorBox.textContent = err.message;
            errorBox.classList.add('show');

        }

    });

}


// ===== فرم ثبت‌نام =====
function initRegisterForm() {

    const form = document.getElementById('registerForm');
    const errorBox = document.getElementById('registerError');

    if (!form) return;

    form.addEventListener('submit', async function (e) {

        e.preventDefault();

        errorBox.classList.remove('show');

        const name = document.getElementById('registerName').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPass').value;

        try {

            await CustomerAuth.register(name, phone, password);

            location.href = getAccountRedirectTarget();

        } catch (err) {

            errorBox.textContent = err.message;
            errorBox.classList.add('show');

        }

    });

}


redirectIfAlreadyLoggedIn();
initAccountTabs();
initLoginForm();
initRegisterForm();
