// ============================================================
// AMIN SYSTEM - NAVBAR (HIDE/SHOW ON SCROLL)
// ============================================================

const navbar =
    document.getElementById('navbar');

let lastScrollY =
    window.scrollY;

let isNavbarVisible = true;


window.addEventListener(
    'scroll',
    function() {

        const currentScrollY =
            window.scrollY;


        // پایین رفتن صفحه
        if (
            currentScrollY > lastScrollY &&
            currentScrollY > 100
        ) {

            if (isNavbarVisible) {

                navbar.classList.add('hidden');

                navbar.classList.remove('visible');

                isNavbarVisible = false;

            }

        }

        // بالا رفتن صفحه
        else if (
            currentScrollY < lastScrollY
        ) {

            if (!isNavbarVisible) {

                navbar.classList.remove('hidden');

                navbar.classList.add('visible');

                isNavbarVisible = true;

            }

        }


        // حالت اسکرول شده
        if (currentScrollY > 30) {

            navbar.classList.add('scrolled');

        } else {

            navbar.classList.remove('scrolled');

        }


        lastScrollY =
            currentScrollY;

    }
);


navbar.classList.add('visible');


// ============================================================
// ===== منوی موبایل (همبرگری + آکاردئون دراپ‌داون‌ها) ==========
// ============================================================

function isMobileNav() {
    return window.innerWidth <= 768;
}


const navToggle = document.getElementById('navToggle');
const navLinksEl = document.querySelector('.nav-links');

if (navToggle && navLinksEl) {

    navToggle.addEventListener('click', function () {

        const isOpen = navLinksEl.classList.toggle('mobile-open');

        navToggle.classList.toggle('open', isOpen);

        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    });


    function closeMobileMenu() {

        navLinksEl.classList.remove('mobile-open');

        navToggle.classList.remove('open');

        navToggle.setAttribute('aria-expanded', 'false');

        document
            .querySelectorAll('.dropdown.mobile-expanded, .sub-dropdown.mobile-expanded')
            .forEach(el => el.classList.remove('mobile-expanded'));

    }


    // ===== باز/بسته کردن آکاردئون «محصولات» و زیردسته‌ها با تپ (فقط در حالت موبایل) =====
    document.querySelectorAll('.dropdown > a, .sub-dropdown > a').forEach(link => {

        link.addEventListener('click', function (e) {

            if (!isMobileNav()) return;

            e.preventDefault();

            const parent = this.parentElement;

            parent.classList.toggle('mobile-expanded');

        });

    });


    // ===== بستن منو با کلیک روی لینک‌های نهایی (بدون زیرمنو) =====
    document.querySelectorAll('.nav-links a:not(.dropdown > a):not(.sub-dropdown > a)').forEach(link => {

        link.addEventListener('click', closeMobileMenu);

    });


    // ===== بستن منو با تغییر اندازه صفحه به دسکتاپ =====
    window.addEventListener('resize', function () {

        if (!isMobileNav()) {
            closeMobileMenu();
        }

    });

}


// ============================================================
// ===== جستجوی محصول ==========================================
// ============================================================

// آدرس صفحه محصولات بسته به عمق صفحه فعلی (ریشه سایت یا داخل pages/)
function getProductsPageUrl(query) {

    const isInPagesFolder = location.pathname.includes('/pages/');

    const base = isInPagesFolder ? 'products.html' : 'pages/products.html';

    const params = new URLSearchParams();

    if (query) {
        params.set('q', query);
    }

    const qs = params.toString();

    return qs ? `${base}?${qs}` : base;

}


const searchWrapper = document.getElementById('searchWrapper');
const searchForm = document.getElementById('navSearchForm');

if (searchWrapper && searchForm) {

    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchInput = document.getElementById('navSearchInput');

    searchIconBtn.addEventListener('click', function (e) {

        e.stopPropagation();

        searchWrapper.classList.toggle('open');

        if (searchWrapper.classList.contains('open')) {
            searchInput.focus();
        }

    });

    // بستن باکس جستجو با کلیک بیرون از آن
    document.addEventListener('click', function (e) {

        if (!searchWrapper.contains(e.target)) {
            searchWrapper.classList.remove('open');
        }

    });

    searchForm.addEventListener('submit', function (e) {

        e.preventDefault();

        const query = searchInput.value.trim();

        location.href = getProductsPageUrl(query);

    });

}
