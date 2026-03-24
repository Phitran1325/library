"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReviewRequest = exports.validateReturnRequest = exports.validateBorrowRequest = exports.validateProfileUpdateFields = exports.validateAddress = exports.validatePhoneNumber = exports.validateFullName = exports.validateProfileUpdate = void 0;
const borrowingConstants_1 = require("../utils/borrowingConstants");
// Profile update validation
const validateProfileUpdate = (req, res, next) => {
    const { fullName, phoneNumber, address } = req.body;
    // Check if at least one field is provided
    if (!fullName && !phoneNumber && !address) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }
    // Validate full name if provided
    if (fullName && fullName.trim().length < 2) {
        return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    }
    // Validate phone number if provided
    if (phoneNumber && !/^[0-9+\-\s()]{10,15}$/.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
    }
    next();
};
exports.validateProfileUpdate = validateProfileUpdate;
// Individual validation functions
const validateFullName = (fullName) => {
    if (!fullName || fullName.trim().length < 2) {
        return { isValid: false, message: 'Full name must be at least 2 characters' };
    }
    return { isValid: true };
};
exports.validateFullName = validateFullName;
const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
        return { isValid: true }; // Phone number is optional
    }
    if (!/^[0-9+\-\s()]{10,15}$/.test(phoneNumber)) {
        return { isValid: false, message: 'Invalid phone number format' };
    }
    return { isValid: true };
};
exports.validatePhoneNumber = validatePhoneNumber;
const validateAddress = (address) => {
    if (!address) {
        return { isValid: true }; // Address is optional
    }
    if (address.trim().length < 5) {
        return { isValid: false, message: 'Address must be at least 5 characters' };
    }
    return { isValid: true };
};
exports.validateAddress = validateAddress;
// Combined validation for profile update
const validateProfileUpdateFields = (fullName, phoneNumber, address) => {
    // Check if at least one field is provided
    if (!fullName && !phoneNumber && !address) {
        return { isValid: false, message: 'At least one field must be provided' };
    }
    // Validate each field if provided
    const fullNameValidation = fullName ? (0, exports.validateFullName)(fullName) : { isValid: true };
    if (!fullNameValidation.isValid) {
        return fullNameValidation;
    }
    const phoneValidation = phoneNumber ? (0, exports.validatePhoneNumber)(phoneNumber) : { isValid: true };
    if (!phoneValidation.isValid) {
        return phoneValidation;
    }
    const addressValidation = address ? (0, exports.validateAddress)(address) : { isValid: true };
    if (!addressValidation.isValid) {
        return addressValidation;
    }
    return { isValid: true };
};
exports.validateProfileUpdateFields = validateProfileUpdateFields;
// Borrow validation
const validateBorrowRequest = (req, res, next) => {
    const { bookId } = req.body;
    if (!bookId) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp ID sách (bookId)'
        });
    }
    // Kiểm tra nếu là object (có thể do frontend gửi nhầm)
    if (typeof bookId === 'object' && bookId !== null) {
        return res.status(400).json({
            success: false,
            message: 'ID sách không hợp lệ: vui lòng chỉ gửi ID (string), không gửi toàn bộ object. Nếu là object, hãy gửi bookId._id hoặc bookId.id'
        });
    }
    // Kiểm tra bookId phải là string
    if (typeof bookId !== 'string' || bookId.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'ID sách không hợp lệ: phải là chuỗi'
        });
    }
    // Kiểm tra nếu string chứa object representation (có thể do JSON.stringify)
    if (bookId.startsWith('{') || bookId.includes('_id:') || bookId.includes('ObjectId(')) {
        return res.status(400).json({
            success: false,
            message: 'ID sách không hợp lệ: vui lòng chỉ gửi ID (string), không gửi toàn bộ object. Nếu là object, hãy gửi bookId._id hoặc bookId.id'
        });
    }
    // Kiểm tra ObjectId format (24 ký tự hex)
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({
            success: false,
            message: 'ID sách không hợp lệ: format không đúng (phải là ObjectId hợp lệ)'
        });
    }
    next();
};
exports.validateBorrowRequest = validateBorrowRequest;
// Return book validation
const validateReturnRequest = (req, res, next) => {
    const { bookCondition, notes } = req.body;
    // Debug logging
    console.log('validateReturnRequest:', {
        bookCondition,
        notes,
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {})
    });
    // bookCondition là optional, nhưng nếu có thì phải hợp lệ
    const validConditions = Object.values(borrowingConstants_1.BOOK_CONDITION);
    if (bookCondition !== undefined && bookCondition !== null && bookCondition !== '') {
        if (!validConditions.includes(bookCondition)) {
            return res.status(400).json({
                success: false,
                message: `Tình trạng sách không hợp lệ. Giá trị hợp lệ: ${validConditions.join(', ')}. Nhận được: "${bookCondition}"`
            });
        }
    }
    // notes là optional, nhưng nếu có thì phải là string và không được quá 500 ký tự
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Ghi chú phải là chuỗi ký tự'
            });
        }
        if (notes.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Ghi chú không được vượt quá 500 ký tự'
            });
        }
    }
    next();
};
exports.validateReturnRequest = validateReturnRequest;
// Review validation
const validateReviewRequest = (req, res, next) => {
    const { rating, comment, bookId } = req.body;
    // rating: required cho tạo mới, optional cho cập nhật
    if (rating !== undefined) {
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá phải là số từ 1 đến 5'
            });
        }
    }
    if (comment !== undefined) {
        if (typeof comment !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Bình luận phải là chuỗi ký tự'
            });
        }
        if (comment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Bình luận không được vượt quá 1000 ký tự'
            });
        }
    }
    if (bookId !== undefined) {
        if (typeof bookId !== 'string' || bookId.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'ID sách không hợp lệ'
            });
        }
    }
    next();
};
exports.validateReviewRequest = validateReviewRequest;
//# sourceMappingURL=validation.js.map