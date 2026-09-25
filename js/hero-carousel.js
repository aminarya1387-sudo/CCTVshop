// ============================================================
// AMIN SYSTEM - HERO BANNER CAROUSEL
// اسلایدر بنرهای صفحه اصلی: بنرها از /api/banners خوانده می‌شوند
// (از پنل مدیریت ← بنرها قابل مدیریت هستند). با کشیدن چپ/راست (ماوس
// یا لمس)، فلش‌ها، نقطه‌ها و کلیدهای جهت‌نما عوض می‌شوند و به‌صورت
// خودکار هم می‌چرخند. پنل مدیریت از همین فایل برای پیش‌نمایش زنده
// استفاده می‌کند (BannerSlider.slideHTML و BannerSlider.mount).
// ============================================================

const BannerSlider = (function () {

    const AUTOPLAY_MS = 6500;

    const toFa = value => String(value).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

    const esc = value => String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const asset = path => (typeof resolveAsset === 'function' ? resolveAsset(path) : path);


    // ===== متن شمارش معکوس (مثلاً «۳ روز ۰۴:۱۲:۵۹») =====
    function countdownText(endIso) {

        const left = Math.max(0, Math.floor((Date.parse(endIso) - Date.now()) / 1000));

        const days = Math.floor(left / 86400);
        const pad = n => String(n).padStart(2, '0');
        const clock = `${pad(Math.floor(left % 86400 / 3600))}:${pad(Math.floor(left % 3600 / 60))}:${pad(left % 60)}`;

        return toFa(days > 0 ? `${days} روز  ${clock}` : clock);

    }


    // ===== HTML یک اسلاید =====
    function slideHTML(b) {

        const hasCountdown = b.countdownEnd && Date.parse(b.countdownEnd) > Date.now();
        const image = b.image ? asset(b.image) : '';

        const visual = image
            ? `
                <div class="hc-frame">
                    <img src="${esc(image)}" alt="${esc(b.title)}" draggable="false" />
                    <span class="hc-rec"><i></i> REC</span>
                    <span class="hc-cam-id">CAM-0${esc((b.id || 1) % 10)}</span>
                    <span class="hc-corner tl"></span><span class="hc-corner tr"></span>
                    <span class="hc-corner bl"></span><span class="hc-corner br"></span>
                    <span class="hc-scanline"></span>
                </div>
            `
            : `
                <div class="hc-icon">
                    <span class="hc-ring r1"></span><span class="hc-ring r2"></span>
                    <i class="fas ${esc(b.icon || 'fa-camera-retro')}"></i>
                </div>
            `;

        return `
            <article class="hc-slide theme-${esc(b.theme || 'ocean')}" data-id="${esc(b.id || '')}" role="group" aria-roledescription="slide">

                <div class="hc-bg">
                    ${image ? `<img class="hc-bg-img" src="${esc(image)}" alt="" draggable="false" />` : ''}
                </div>

                <div class="hc-fx" aria-hidden="true">
                    <span class="hc-orb o1"></span>
                    <span class="hc-orb o2"></span>
                    <span class="hc-grid"></span>
                </div>

                <div class="hc-content">
                    ${b.badge ? `<span class="hc-badge">${esc(b.badge)}</span>` : ''}
                    <h1>${esc(b.title)} ${b.highlight ? `<span>${esc(b.highlight)}</span>` : ''}</h1>
                    ${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ''}
                    ${hasCountdown ? `
                        <div class="hc-countdown">
                            <i class="fas fa-clock"></i>
                            <span data-countdown="${esc(b.countdownEnd)}">${countdownText(b.countdownEnd)}</span>
                        </div>
                    ` : ''}
                    ${b.buttonText ? `
                        <a href="${esc(b.buttonLink || '#')}" class="btn-hero" data-banner-cta>
                            ${esc(b.buttonText)} <i class="fas fa-arrow-left"></i>
                        </a>
                    ` : ''}
                </div>

                <div class="hc-visual">${visual}</div>

            </article>
        `;

    }


    // ===== راه‌اندازی اسلایدر روی یک ریشه‌ی .hero-carousel =====
    // opts.preview: در پنل مدیریت، لینک‌ها کار نکنند و آمار ثبت نشود
    // opts.autoplay: چرخش خودکار (پیش‌فرض true)
    function mount(root, banners, opts = {}) {

        if (root._bannerSlider) {
            root._bannerSlider.destroy();
        }

        const track = root.querySelector('.hc-track');
        const viewport = root.querySelector('.hc-viewport');
        const dotsEl = root.querySelector('.hc-dots');
        const counterEl = root.querySelector('.hc-counter');
        const progressEl = root.querySelector('.hc-progress span');
        const prevBtn = root.querySelector('.hc-prev');
        const nextBtn = root.querySelector('.hc-next');

        track.innerHTML = banners.map(slideHTML).join('');

        const slides = Array.from(track.children);
        const count = slides.length;

        root.classList.toggle('is-single', count <= 1);

        dotsEl.innerHTML = slides.map((_, i) => `
            <button type="button" class="hc-dot" role="tab" aria-label="بنر ${toFa(i + 1)}" data-index="${i}"></button>
        `).join('');

        const dots = Array.from(dotsEl.children);

        // در صفحه‌ی راست‌به‌چپ، اسلاید بعدی سمت چپ است و با کشیدن به راست می‌آید
        const dirSign = () => (getComputedStyle(track).direction === 'rtl' ? 1 : -1);

        let index = 0;
        let elapsed = 0;
        let lastTick = 0;
        let paused = false;
        let rafId = 0;
        let countdownTimer = 0;
        const seen = new Set();

        const autoplay = opts.autoplay !== false && count > 1;


        function setTranslate(extraPx, animate) {
            track.style.transition = animate ? '' : 'none';
            track.style.transform = `translate3d(calc(${dirSign() * index * 100}% + ${extraPx}px), 0, 0)`;
        }


        function trackView() {

            const id = banners[index] && banners[index].id;

            if (opts.preview || !id || seen.has(id) || document.hidden) return;

            seen.add(id);
            track_(id, 'view');

        }


        function goTo(target, animate = true) {

            if (count === 0) return;

            index = (target + count) % count;

            setTranslate(0, animate);

            slides.forEach((s, i) => {
                s.classList.toggle('is-active', i === index);
                s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
                s.querySelectorAll('a, button').forEach(el => { el.tabIndex = i === index ? 0 : -1; });
            });

            dots.forEach((d, i) => d.classList.toggle('active', i === index));

            if (counterEl) {
                counterEl.innerHTML = count > 1
                    ? `<strong>${toFa(String(index + 1).padStart(2, '0'))}</strong> / ${toFa(String(count).padStart(2, '0'))}`
                    : '';
            }

            elapsed = 0;
            trackView();

        }


        const next = () => goTo(index + 1);
        const prev = () => goTo(index - 1);


        // ===== چرخش خودکار + نوار پیشرفت (با توقف روی هاور/فوکوس/تب مخفی) =====
        function tick(now) {

            if (!lastTick) lastTick = now;

            const delta = now - lastTick;
            lastTick = now;

            if (autoplay && !paused && !dragging && !document.hidden) {

                elapsed += delta;

                if (elapsed >= AUTOPLAY_MS) {
                    next();
                }

            }

            if (progressEl) {
                progressEl.style.transform = `scaleX(${autoplay ? Math.min(1, elapsed / AUTOPLAY_MS) : 0})`;
            }

            rafId = requestAnimationFrame(tick);

        }


        // ===== کشیدن با ماوس یا لمس (Pointer Events) =====
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let dx = 0;
        let moved = false;
        let startTime = 0;
        let pointerId = null;

        function onDown(e) {

            if (count <= 1 || (e.pointerType === 'mouse' && e.button !== 0)) return;

            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            dx = 0;
            startTime = performance.now();
            pointerId = e.pointerId;

        }

        function onMove(e) {

            // افکت عمق (tilt) تصویر اسلاید فعال با حرکت ماوس
            if (!dragging && e.pointerType === 'mouse') {
                const rect = root.getBoundingClientRect();
                root.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width - 0.5).toFixed(3));
                root.style.setProperty('--my', ((e.clientY - rect.top) / rect.height - 0.5).toFixed(3));
            }

            if (!dragging || e.pointerId !== pointerId) return;

            dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (!moved) {

                // حرکت عمودی = اسکرول صفحه، نه کشیدن اسلایدر
                if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
                    dragging = false;
                    return;
                }

                if (Math.abs(dx) < 6) return;

                moved = true;
                root.classList.add('is-dragging');
                viewport.setPointerCapture(pointerId);

            }

            setTranslate(dx, false);

        }

        function onUp(e) {

            if (!dragging || (e && e.pointerId !== pointerId)) return;

            dragging = false;
            root.classList.remove('is-dragging');

            if (!moved) return;

            const width = viewport.clientWidth || 1;
            const velocity = Math.abs(dx) / Math.max(1, performance.now() - startTime);
            const passed = Math.abs(dx) > width * 0.18 || (velocity > 0.45 && Math.abs(dx) > 30);

            if (passed) {
                // کشیدن هم‌جهت با dirSign یعنی اسلاید بعدی
                (Math.sign(dx) === dirSign() ? next : prev)();
            } else {
                setTranslate(0, true);
            }

        }

        // جلوگیری از کلیک ناخواسته روی لینک بعد از کشیدن
        function onClickCapture(e) {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
                moved = false;
            }
        }

        function onCtaClick(e) {

            const cta = e.target.closest('[data-banner-cta]');

            if (!cta) return;

            if (opts.preview) {
                e.preventDefault();
                return;
            }

            const id = banners[index] && banners[index].id;
            if (id) track_(id, 'click');

        }

        function onKey(e) {

            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

            e.preventDefault();

            const towardNext = (e.key === 'ArrowLeft') === (dirSign() === 1);
            (towardNext ? next : prev)();

        }

        const pause = () => { paused = true; };
        const resume = () => { paused = false; };

        viewport.addEventListener('pointerdown', onDown);
        root.addEventListener('pointermove', onMove);
        viewport.addEventListener('pointerup', onUp);
        viewport.addEventListener('pointercancel', onUp);
        viewport.addEventListener('click', onClickCapture, true);
        root.addEventListener('click', onCtaClick);
        root.addEventListener('keydown', onKey);
        root.addEventListener('mouseenter', pause);
        root.addEventListener('mouseleave', resume);
        root.addEventListener('focusin', pause);
        root.addEventListener('focusout', resume);

        const onPrev = () => prev();
        const onNext = () => next();
        const onDot = e => {
            const dot = e.target.closest('.hc-dot');
            if (dot) goTo(Number(dot.dataset.index));
        };

        prevBtn && prevBtn.addEventListener('click', onPrev);
        nextBtn && nextBtn.addEventListener('click', onNext);
        dotsEl.addEventListener('click', onDot);

        const onResize = () => setTranslate(0, false);
        window.addEventListener('resize', onResize);

        // شمارش معکوس همه‌ی اسلایدها
        countdownTimer = setInterval(() => {
            root.querySelectorAll('[data-countdown]').forEach(el => {
                el.textContent = countdownText(el.dataset.countdown);
            });
        }, 1000);

        if (!root.hasAttribute('tabindex')) root.tabIndex = 0;

        goTo(0, false);
        rafId = requestAnimationFrame(tick);

        const api = {
            goTo,
            next,
            prev,
            get index() { return index; },
            destroy() {
                cancelAnimationFrame(rafId);
                clearInterval(countdownTimer);
                viewport.removeEventListener('pointerdown', onDown);
                root.removeEventListener('pointermove', onMove);
                viewport.removeEventListener('pointerup', onUp);
                viewport.removeEventListener('pointercancel', onUp);
                viewport.removeEventListener('click', onClickCapture, true);
                root.removeEventListener('click', onCtaClick);
                root.removeEventListener('keydown', onKey);
                root.removeEventListener('mouseenter', pause);
                root.removeEventListener('mouseleave', resume);
                root.removeEventListener('focusin', pause);
                root.removeEventListener('focusout', resume);
                prevBtn && prevBtn.removeEventListener('click', onPrev);
                nextBtn && nextBtn.removeEventListener('click', onNext);
                dotsEl.removeEventListener('click', onDot);
                window.removeEventListener('resize', onResize);
                root._bannerSlider = null;
            }
        };

        root._bannerSlider = api;

        return api;

    }


    // ===== ثبت نمایش/کلیک (بدون منتظر ماندن و بدون خطا دادن) =====
    function track_(id, type) {

        const url = `/api/banners/${encodeURIComponent(id)}/track`;
        const body = JSON.stringify({ type });

        try {
            if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))) {
                return;
            }
        } catch (e) {
            // مرورگر sendBeacon ندارد - با fetch ادامه می‌دهیم
        }

        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
            .catch(() => {});

    }


    return { slideHTML, mount, countdownText };

})();


// ===== صفحه اصلی: خواندن بنرها از سرور و راه‌اندازی اسلایدر =====
(async function initHomeHero() {

    const root = document.getElementById('heroCarousel');

    if (!root || root.dataset.manual !== undefined) return;

    let banners = [];

    try {
        const res = await fetch('/api/banners');
        if (res.ok) banners = await res.json();
    } catch (e) {
        // سرور در دسترس نیست - همان اسلاید پیش‌فرض داخل HTML می‌ماند
    }

    if (banners.length === 0) {
        root.classList.add('is-single');
        return;
    }

    BannerSlider.mount(root, banners);

})();
