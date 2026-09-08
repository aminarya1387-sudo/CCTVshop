// ============================================================
// AMIN SYSTEM - ADMIN ORDERS PAGE
// ============================================================

const statusLabels = {
    pending: 'در انتظار',
    confirmed: 'تأییدشده',
    shipped: 'ارسال‌شده',
    cancelled: 'لغوشده'
};

const paymentLabels = {
    cod: 'پرداخت درب منزل',
    transfer: 'کارت به کارت'
};

let currentStatusFilter = 'all';


function formatDate(iso) {
    try {
        return new Date(iso).toLocaleString('fa-IR');
    } catch (e) {
        return '';
    }
}


async function renderOrders() {

    const list = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    const countEl = document.getElementById('orderCount');

    const allOrders = await OrderStore.getAll();

    const orders = currentStatusFilter === 'all'
        ? allOrders
        : allOrders.filter(o => o.status === currentStatusFilter);

    countEl.innerText = `${allOrders.length} سفارش`;

    if (orders.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    list.innerHTML = orders.map(order => `
        <div class="order-card" data-id="${order.id}">

            <div class="order-card-head">

                <div class="order-head-main">
                    <div>
                        <div class="order-number">${order.orderNumber}</div>
                        <div class="order-customer">${order.customer.name} - ${order.customer.phone}</div>
                    </div>
                </div>

                <div class="order-head-meta">
                    <span class="order-date">${formatDate(order.createdAt)}</span>
                    <span class="order-total">${(order.totalPrice || 0).toLocaleString('fa-IR')} تومان</span>
                    <span class="status-badge ${order.status}">${statusLabels[order.status] || order.status}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>

            </div>

            <div class="order-card-body">

                <div class="order-body-grid">

                    <div class="order-info-block">
                        <h4><i class="fas fa-user"></i> اطلاعات گیرنده</h4>
                        <div class="order-info-row"><span>نام</span><strong>${order.customer.name}</strong></div>
                        <div class="order-info-row"><span>موبایل</span><strong>${order.customer.phone}</strong></div>
                        <div class="order-info-row"><span>شهر</span><strong>${order.customer.city}</strong></div>
                        <div class="order-info-row"><span>آدرس</span><strong>${order.customer.address}</strong></div>
                        <div class="order-info-row"><span>روش پرداخت</span><strong>${paymentLabels[order.payment] || order.payment}</strong></div>
                    </div>

                    <div class="order-info-block">
                        <h4><i class="fas fa-box"></i> اقلام سفارش (${order.totalCount || 0} کالا)</h4>
                        ${order.items.map(item => `
                            <div class="order-item-row">
                                <div class="order-item-icon">
                                    ${productMedia(item)}
                                </div>
                                <span>${item.name} × ${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>

                </div>

                <div class="order-status-actions">
                    ${Object.keys(statusLabels).map(key => `
                        <button class="order-status-btn" data-status="${key}" data-id="${order.id}">
                            علامت‌گذاری: ${statusLabels[key]}
                        </button>
                    `).join('')}
                </div>

            </div>

        </div>
    `).join('');

    // باز/بسته کردن کارت سفارش
    list.querySelectorAll('.order-card-head').forEach(head => {
        head.addEventListener('click', () => {
            head.closest('.order-card').classList.toggle('open');
        });
    });

    // تغییر وضعیت سفارش
    list.querySelectorAll('.order-status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            const status = btn.dataset.status;

            try {
                await OrderStore.updateStatus(id, status);
                await renderOrders();
            } catch (err) {
                alert(err.message || 'تغییر وضعیت با خطا مواجه شد');
            }
        });
    });

}


function initStatusFilter() {

    document.querySelectorAll('.status-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            currentStatusFilter = chip.dataset.status;

            document.querySelectorAll('.status-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            renderOrders();
        });
    });

}


(async function init() {

    const orderSession = await renderAdminSidebar('orders');

    if (orderSession) {
        initStatusFilter();
        renderOrders();
    }

})();
