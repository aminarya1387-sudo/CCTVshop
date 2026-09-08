// ============================================================
// AMIN SYSTEM - PASSWORD HASHING
// از ماژول داخلی crypto خودِ Node.js استفاده می‌کند (scrypt) -
// نیازی به نصب پکیج جدا (مثل bcrypt) نیست.
// ============================================================

const crypto = require('crypto');


// ===== ساخت هش از پسورد خام (برای ذخیره در دیتابیس) =====
function hashPassword(plainPassword) {

    const salt = crypto.randomBytes(16).toString('hex');

    const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');

    return `${salt}:${hash}`;

}


// ===== مقایسه پسورد وارد‌شده با هش ذخیره‌شده =====
function verifyPassword(plainPassword, storedHash) {

    const [salt, originalHash] = storedHash.split(':');

    if (!salt || !originalHash) return false;

    const hashToCheck = crypto.scryptSync(plainPassword, salt, 64).toString('hex');

    // مقایسه امن (در برابر timing attack)
    return crypto.timingSafeEqual(
        Buffer.from(originalHash, 'hex'),
        Buffer.from(hashToCheck, 'hex')
    );

}


module.exports = { hashPassword, verifyPassword };
