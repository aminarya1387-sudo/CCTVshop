// ============================================================
// AMIN SYSTEM - ORDER STORE
// ذخیره سفارش‌ها روی بک‌اند واقعی (نه localStorage). همه متدها
// async هستند.
// ============================================================

const OrderStore = {

    API: '/api/orders',

    // ===== لیست همه سفارش‌ها (فقط ادمین لاگین‌کرده) =====
    async getAll() {

        const res = await fetch(this.API);

        if (!res.ok) {
            console.error('OrderStore: خواندن سفارش‌ها با خطا مواجه شد');
            return [];
        }

        return res.json();

    },

    // ===== ثبت سفارش جدید (عمومی، از صفحه تسویه‌حساب) =====
    async add(order) {

        const res = await fetch(this.API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'ثبت سفارش با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== تغییر وضعیت سفارش (فقط ادمین) =====
    async updateStatus(id, status) {

        const res = await fetch(`${this.API}/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'تغییر وضعیت با خطا مواجه شد');
        }

        return res.json();

    },

    // ===== پیگیری سفارش با کد + شماره موبایل (عمومی) =====
    async track(code, phone) {

        const params = new URLSearchParams({ code, phone });

        const res = await fetch(`${this.API}/track?${params.toString()}`);

        if (!res.ok) return null;

        return res.json();

    },

    // ===== تاریخچه سفارش‌های حساب کاربری فعلی =====
    async mine() {

        const res = await fetch(`${this.API}/mine`);

        if (!res.ok) return [];

        return res.json();

    }

};
