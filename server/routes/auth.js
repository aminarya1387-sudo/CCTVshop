// ============================================================
// AMIN SYSTEM - AUTH API
// ============================================================

const express = require('express');
const db = require('../db/database');
const { verifyPassword } = require('../utils/password');

const router = express.Router();


// ===== POST /api/auth/login =====
router.post('/login', (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'یوزرنیم یا پسورد اشتباه است' });
    }

    // فقط اطلاعات غیرحساس داخل نشست ذخیره می‌شود
    req.session.user = {
        username: user.username,
        role: user.role,
        displayName: user.displayName
    };

    res.json(req.session.user);

});


// ===== POST /api/auth/logout =====
router.post('/logout', (req, res) => {

    req.session.destroy(() => {
        res.json({ success: true });
    });

});


// ===== GET /api/auth/me - آیا نشستی فعال است؟ =====
router.get('/me', (req, res) => {

    if (!req.session.user) {
        return res.status(401).json({ error: 'لاگین نیستید' });
    }

    res.json(req.session.user);

});


module.exports = router;
