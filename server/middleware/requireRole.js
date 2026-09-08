// ============================================================
// AMIN SYSTEM - AUTH MIDDLEWARE
// روی مسیرهایی که فقط ادمین باید بهشون دسترسی داشته باشه گذاشته
// می‌شود. چک می‌کند که کاربر لاگین کرده و نقش درستی دارد.
// ============================================================

function requireRole(...allowedRoles) {

    return function (req, res, next) {

        const user = req.session.user;

        if (!user) {
            return res.status(401).json({ error: 'ابتدا وارد پنل مدیریت شوید' });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'شما به این بخش دسترسی ندارید' });
        }

        next();

    };

}

module.exports = requireRole;
