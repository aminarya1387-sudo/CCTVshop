// ============================================================
// AMIN SYSTEM - MAIN SCRIPT
// (بارگذاری شده بعد از همه ماژول‌های دیگر)
// ============================================================

// (شمارش معکوس جشنواره حالا داخل هر بنر اسلایدر است - js/hero-carousel.js)


// ============================================================
// ===== SMOOTH SCROLL ========================================
// ============================================================

document
    .querySelectorAll('a[href^="#"]')
    .forEach(anchor => {

        anchor.addEventListener(
            'click',
            function(e) {

                const targetId =
                    this.getAttribute('href');


                if (targetId === '#') {
                    return;
                }


                const target =
                    document.querySelector(
                        targetId
                    );


                if (target) {

                    e.preventDefault();

                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                }

            }
        );

    });


// ============================================================
// ===== BACK TO TOP ==========================================
// ============================================================

const backBtn =
    document.getElementById('backToTop');


if (backBtn) {

    backBtn.addEventListener(
        'click',
        () => {

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

        }
    );

}


window.addEventListener(
    'scroll',
    () => {

        if (backBtn) {

            if (window.scrollY > 400) {

                backBtn.classList.add('visible');

            } else {

                backBtn.classList.remove('visible');

            }

        }

    }
);


console.log(
    '🚀 AMIN SYSTEM - همه سیستم‌ها فعال!'
);
