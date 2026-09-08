// ============================================================
// AMIN SYSTEM - TRACK ORDER (پیگیری سفارش با کد + موبایل)
// ============================================================

function showTrackResultSection() {
    document.getElementById('trackResultSection').style.display = 'block';

    document.getElementById('trackResultSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


function renderOrderResult(order) {

    showTrackResultSection();

    document.getElementById('trackOrderResult').innerHTML = buildOrderCardHTML(order);

}


function renderNotFound() {

    showTrackResultSection();

    document.getElementById('trackOrderResult').innerHTML = `
        <div class="track-not-found">
            <i class="fas fa-circle-exclamation"></i>
            سفارشی با این کد و شماره موبایل پیدا نشد. لطفاً دوباره بررسی کنید.
        </div>
    `;

}


function initTrackOrderForm() {

    const form = document.getElementById('trackOrderForm');

    if (!form) return;

    form.addEventListener('submit', async function (e) {

        e.preventDefault();

        const code = document.getElementById('trackOrderCode').value.trim();
        const phone = document.getElementById('trackOrderPhone').value.trim();

        const order = await OrderStore.track(code, phone);

        if (!order) {
            renderNotFound();
            return;
        }

        renderOrderResult(order);

    });

}


initTrackOrderForm();
