// ===== ابزارهای مشترک سفارش‌ها =====
// (بین routes/orders-public.js و routes/orders-admin.js مشترک است)

// تبدیل اعداد فارسی/عربی به انگلیسی و حذف هرچیز غیر از رقم
function normalizePhone(value) {

    if (!value) return '';

    return String(value)
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
        .replace(/\D/g, '');

}


// تبدیل ردیف دیتابیس سفارش به شکلی که فرانت‌اند انتظار دارد
function rowToOrder(row) {
    return {
        id: row.id,
        orderNumber: row.orderNumber,
        customerId: row.customerId,
        customer: {
            name: row.customerName,
            phone: row.customerPhone,
            city: row.customerCity,
            address: row.customerAddress
        },
        payment: row.payment,
        items: JSON.parse(row.itemsJson || '[]'),
        totalCount: row.totalCount,
        totalPrice: row.totalPrice,
        status: row.status,
        createdAt: row.createdAt
    };
}


// تولید کد سفارش یکتا
function generateOrderNumber() {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `AS-${rand}`;
}


module.exports = { normalizePhone, rowToOrder, generateOrderNumber };
