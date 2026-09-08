// ============================================================
// AMIN SYSTEM - MAIN SCRIPT
// (بارگذاری شده بعد از همه ماژول‌های دیگر)
// ============================================================

// ===== COUNTDOWN TIMER =====
let totalSeconds = 23 * 3600 + 59 * 60 + 59;

function updateTimer() {
    const timerEl = document.getElementById('timer');

    // صفحاتی که تایمر جشنواره ندارند (مثل صفحه محصولات) این بخش را نادیده می‌گیرند
    if (!timerEl) return;

    if (totalSeconds <= 0) {
        timerEl.innerText = '۰۰:۰۰:۰۰';
        return;
    }

    totalSeconds--;

    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');

    timerEl.innerText = `${hrs}:${mins}:${secs}`;
}

setInterval(updateTimer, 1000);


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
