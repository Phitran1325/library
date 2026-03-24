"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFullName = exports.validateOTP = exports.validatePassword = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return re.test(password);
};
exports.validatePassword = validatePassword;
const validateOTP = (otp) => {
    // 6-digit numeric OTP
    const re = /^\d{6}$/;
    return re.test(otp);
};
exports.validateOTP = validateOTP;
const validateFullName = (fullName) => {
    // 3-30 characters, letters and spaces only
    const re = /^[a-zA-ZÀ-ỹ\s]{3,30}$/;
    return re.test(fullName);
};
exports.validateFullName = validateFullName;
//# sourceMappingURL=validators.js.map