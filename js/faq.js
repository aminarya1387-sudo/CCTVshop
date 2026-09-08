// ============================================================
// AMIN SYSTEM - FAQ TOGGLE
// ============================================================

document
    .querySelectorAll('.faq-question')
    .forEach(btn => {

        btn.addEventListener(
            'click',
            function() {

                const answer =
                    this.nextElementSibling;

                const icon =
                    this.querySelector('i');


                document
                    .querySelectorAll('.faq-answer')
                    .forEach(a => {

                        if (a !== answer) {

                            a.classList.remove('open');

                            a.previousElementSibling
                                .querySelector('i')
                                .classList
                                .remove('active');

                        }

                    });


                answer.classList.toggle('open');

                icon.classList.toggle('active');

            }
        );

    });
