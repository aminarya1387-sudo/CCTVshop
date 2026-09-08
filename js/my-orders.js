// ============================================================
// AMIN SYSTEM - MY ORDERS (تاریخچه سفارش‌های حساب کاربری)
// ============================================================

async function renderMyOrders() {

    const session = await CustomerAuth.getSession();

    if (!session) {
        location.href = 'account.html?redirect=my-orders.html';
        return;
    }

    document.getElementById('myOrdersWelcome').textContent = `سلام ${session.name} 👋`;

    const orders = await OrderStore.mine();

    const list = document.getElementById('myOrdersList');
    const empty = document.getElementById('myOrdersEmpty');

    if (orders.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    list.innerHTML = orders.map(order => buildOrderCardHTML(order)).join('');

}


renderMyOrders();
