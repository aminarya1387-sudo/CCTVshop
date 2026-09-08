// ============================================================
// AMIN SYSTEM - SCROLL ANIMATIONS & PARALLAX
// ============================================================

// ===== INTERSECTION OBSERVER (animate-on-scroll) =====
document.addEventListener(
    'DOMContentLoaded',
    function() {

        const elements =
            document.querySelectorAll(
                '.animate-on-scroll'
            );


        const observer =
            new IntersectionObserver(
                (entries) => {

                    entries.forEach(
                        entry => {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target
                                    .classList
                                    .add('visible');

                            }

                        }
                    );

                },
                {
                    threshold: 0.1,
                    rootMargin:
                        '0px 0px -30px 0px'
                }
            );


        elements.forEach(
            el => observer.observe(el)
        );

    }
);


// ============================================================
// ===== PARALLAX =============================================
// ============================================================

document.addEventListener(
    'mousemove',
    function(e) {

        const x =
            e.clientX /
            window.innerWidth;

        const y =
            e.clientY /
            window.innerHeight;


        document
            .querySelectorAll('.parallax')
            .forEach(el => {

                const speed =
                    parseFloat(
                        el.dataset.speed
                    ) || 15;


                const moveX =
                    (x - 0.5) * speed;

                const moveY =
                    (y - 0.5) * speed;


                el.style.transform =
                    `translate(${moveX}px, ${moveY}px)`;

            });

    }
);
