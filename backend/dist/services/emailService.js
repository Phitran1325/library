"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGenericNotificationEmail = exports.sendManualReminderEmail = exports.sendReservationRejectedEmail = exports.sendAutoBorrowEmail = exports.sendOverdueWarningEmail = exports.sendDueDateReminderEmail = exports.sendBorrowSuccessEmail = exports.sendPasswordResetOTP = exports.sendVerificationOTP = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const Borrow_1 = __importDefault(require("../models/Borrow"));
const Book_1 = __importDefault(require("../models/Book"));
const User_1 = __importDefault(require("../models/User"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});
const sendVerificationOTP = async (email, otpCode) => {
    await transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Email Verification OTP',
        html: `
      <h1>Welcome to Library Management System</h1>
      <p>Your email verification code is:</p>
      <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">${otpCode}</h2>
      <p>Please enter this code to verify your email address.</p>
      <p><strong>This code will expire in 10 minutes.</strong></p>
      <p>If you didn't request this verification, please ignore this email.</p>
    `,
    });
};
exports.sendVerificationOTP = sendVerificationOTP;
const sendPasswordResetOTP = async (email, otpCode) => {
    await transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Password Reset OTP',
        html: `
      <h1>Password Reset Request</h1>
      <p>Your password reset code is:</p>
      <h2 style="color: #dc3545; font-size: 32px; letter-spacing: 5px; text-align: center; margin: 20px 0;">${otpCode}</h2>
      <p>Please enter this code to reset your password.</p>
      <p><strong>This code will expire in 10 minutes.</strong></p>
      <p>If you didn't request this password reset, please ignore this email.</p>
    `,
    });
};
exports.sendPasswordResetOTP = sendPasswordResetOTP;
/**
 * Gửi email thông báo mượn sách thành công
 */
const sendBorrowSuccessEmail = async (borrowId) => {
    try {
        const borrow = await Borrow_1.default.findById(borrowId)
            .populate('book', 'title coverImage isbn')
            .populate('user', 'email fullName');
        if (!borrow || !borrow.user || !borrow.book)
            return;
        const user = borrow.user;
        const book = borrow.book;
        const dueDate = new Date(borrow.dueDate).toLocaleDateString('vi-VN');
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: user.email,
            subject: 'Mượn sách thành công - Library Management System',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #28a745;">Mượn sách thành công!</h1>
          <p>Xin chào <strong>${user.fullName}</strong>,</p>
          <p>Bạn đã mượn thành công cuốn sách:</p>
          <h2>${book.title}</h2>
          <p><strong>Ngày mượn:</strong> ${new Date(borrow.borrowDate).toLocaleDateString('vi-VN')}</p>
          <p><strong>Hạn trả:</strong> <span style="color: #dc3545; font-weight: bold;">${dueDate}</span></p>
          <p>Vui lòng trả sách đúng hạn để tránh phí phạt.</p>
        </div>
      `,
        });
    }
    catch (error) {
        console.error('Error sending borrow success email:', error);
    }
};
exports.sendBorrowSuccessEmail = sendBorrowSuccessEmail;
/**
 * Gửi email nhắc nhở trước hạn trả sách
 */
const sendDueDateReminderEmail = async (borrowId, daysUntilDue) => {
    try {
        const borrow = await Borrow_1.default.findById(borrowId)
            .populate('book', 'title isbn')
            .populate('user', 'email fullName');
        if (!borrow || !borrow.user || !borrow.book)
            return;
        const user = borrow.user;
        const book = borrow.book;
        const dueDate = new Date(borrow.dueDate).toLocaleDateString('vi-VN');
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: user.email,
            subject: `Nhắc nhở: Sách sắp đến hạn trả - ${book.title}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #ffc107;">Nhắc nhở trả sách</h1>
          <p>Xin chào <strong>${user.fullName}</strong>,</p>
          <p>Cuốn sách bạn mượn <strong>${book.title}</strong> sẽ đến hạn trả sau ${daysUntilDue} ngày.</p>
          <p>Hạn trả: <span style="color: #dc3545;">${dueDate}</span></p>
          <p>Vui lòng trả hoặc gia hạn đúng hạn để tránh phí phạt.</p>
        </div>
      `,
        });
    }
    catch (error) {
        console.error('Error sending due date reminder email:', error);
    }
};
exports.sendDueDateReminderEmail = sendDueDateReminderEmail;
/**
 * Gửi email cảnh báo quá hạn
 */
const sendOverdueWarningEmail = async (borrowId, daysOverdue, lateFee) => {
    try {
        const borrow = await Borrow_1.default.findById(borrowId)
            .populate('book', 'title isbn')
            .populate('user', 'email fullName');
        if (!borrow || !borrow.user || !borrow.book)
            return;
        const user = borrow.user;
        const book = borrow.book;
        const dueDate = new Date(borrow.dueDate).toLocaleDateString('vi-VN');
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: user.email,
            subject: `⚠️ Sách đã quá hạn - ${book.title}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #dc3545;">Cảnh báo sách quá hạn!</h1>
          <p>Xin chào <strong>${user.fullName}</strong>,</p>
          <p>Cuốn sách <strong>${book.title}</strong> đã quá hạn ${daysOverdue} ngày.</p>
          <p>Phí phạt hiện tại: <strong>${lateFee.toLocaleString('vi-VN')} VNĐ</strong></p>
          <p>Hạn trả: ${dueDate}</p>
          <p>Vui lòng trả sách sớm nhất có thể để tránh phát sinh thêm phí.</p>
        </div>
      `,
        });
    }
    catch (error) {
        console.error('Error sending overdue warning email:', error);
    }
};
exports.sendOverdueWarningEmail = sendOverdueWarningEmail;
/**
 * Gửi email khi sách được tự động mượn từ reservation
 */
const sendAutoBorrowEmail = async (userId, bookId) => {
    try {
        const user = await User_1.default.findById(userId);
        const book = await Book_1.default.findById(bookId);
        if (!user || !book)
            return;
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: user.email,
            subject: 'Sách đã có sẵn - Tự động mượn thành công',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1 style="color: #28a745;">Tin tốt! Sách bạn đặt trước đã có sẵn</h1>
          <p>Cuốn sách <strong>${book.title}</strong> đã được tự động mượn cho bạn.</p>
          <p>Bạn có thể xem chi tiết trong phần “Quản lý mượn sách”.</p>
        </div>
      `,
        });
    }
    catch (error) {
        console.error('Error sending auto borrow email:', error);
    }
};
exports.sendAutoBorrowEmail = sendAutoBorrowEmail;
/**
 * Gửi email từ chối yêu cầu đặt/mượn sách
 */
const sendReservationRejectedEmail = async (email, bookTitle, reason) => {
    await transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Thông báo từ chối giữ/mượn sách',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #dc3545;">Yêu cầu giữ/mượn sách đã bị từ chối</h2>
        <p><strong>Tựa sách:</strong> ${bookTitle}</p>
        <p><strong>Lý do:</strong> ${reason}</p>
        <p>Nếu cần hỗ trợ thêm, vui lòng liên hệ thủ thư.</p>
      </div>
    `,
    });
};
exports.sendReservationRejectedEmail = sendReservationRejectedEmail;
/**
 * Gửi email nhắc nhở thủ công từ thủ thư
 * - Nếu sách chưa đến hạn: gửi nhắc nhở trước hạn
 * - Nếu sách đã quá hạn: gửi cảnh báo kèm thông tin phí phạt hiện tại
 */
const sendManualReminderEmail = async (borrowId, customMessage) => {
    try {
        const borrow = await Borrow_1.default.findById(borrowId)
            .populate('book', 'title isbn')
            .populate('user', 'email fullName');
        if (!borrow || !borrow.user || !borrow.book) {
            throw new Error('Không tìm thấy phiếu mượn hoặc thông tin không đầy đủ');
        }
        const user = borrow.user;
        const book = borrow.book;
        const dueDate = new Date(borrow.dueDate).toLocaleDateString('vi-VN');
        const now = new Date();
        const isOverdue = borrow.dueDate < now;
        const daysDifference = isOverdue
            ? Math.max(1, Math.floor((now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24)))
            : Math.max(0, Math.floor((borrow.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const messageBlock = customMessage
            ? `<p style="background-color: #f0f8ff; padding: 12px 16px; border-radius: 6px; margin: 20px 0;"><em>${customMessage}</em></p>`
            : '';
        if (isOverdue) {
            await transporter.sendMail({
                from: process.env.SMTP_EMAIL,
                to: user.email,
                subject: `⚠️ Nhắc nhở: Sách đã quá hạn - ${book.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h1 style="color: #dc3545;">Nhắc nhở trả sách</h1>
            <p>Xin chào <strong>${user.fullName}</strong>,</p>
            <p>Thư viện xin nhắc nhở bạn về cuốn sách <strong>${book.title}</strong> đã quá hạn trả.</p>
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0;"><strong>Thông tin mượn sách:</strong></p>
              <p style="margin: 5px 0;">📚 <strong>Sách:</strong> ${book.title}</p>
              <p style="margin: 5px 0;">📅 <strong>Hạn trả:</strong> <span style="color: #dc3545;">${dueDate}</span></p>
              <p style="margin: 5px 0;">⏰ <strong>Số ngày quá hạn:</strong> ${daysDifference} ngày</p>
              <p style="margin: 5px 0;">💰 <strong>Phí phạt hiện tại:</strong> <strong>${(borrow.lateFee || 0).toLocaleString('vi-VN')} VNĐ</strong></p>
            </div>
            ${messageBlock}
            <p>Vui lòng trả sách sớm nhất có thể để tránh phát sinh thêm phí.</p>
            <p>Nếu bạn đã trả hoặc gia hạn, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br><strong>Thư viện</strong></p>
          </div>
        `,
            });
        }
        else {
            await transporter.sendMail({
                from: process.env.SMTP_EMAIL,
                to: user.email,
                subject: `Nhắc nhở: Sách sắp đến hạn trả - ${book.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h1 style="color: #ffc107;">Nhắc nhở trả sách</h1>
            <p>Xin chào <strong>${user.fullName}</strong>,</p>
            <p>Thư viện xin nhắc nhở bạn về cuốn sách <strong>${book.title}</strong> sắp đến hạn trả.</p>
            <div style="background-color: #e7f1ff; padding: 15px; border-left: 4px solid #0d6efd; margin: 20px 0;">
              <p style="margin: 0;"><strong>Thông tin mượn sách:</strong></p>
              <p style="margin: 5px 0;">📚 <strong>Sách:</strong> ${book.title}</p>
              <p style="margin: 5px 0;">📅 <strong>Hạn trả:</strong> <span style="color: #dc3545;">${dueDate}</span></p>
              <p style="margin: 5px 0;">⏰ <strong>Còn lại:</strong> ${daysDifference} ngày</p>
            </div>
            ${messageBlock}
            <p>Vui lòng trả hoặc gia hạn sách đúng hạn để tránh phí phạt.</p>
            <p>Trân trọng,<br><strong>Thư viện</strong></p>
          </div>
        `,
            });
        }
        return {
            borrowId: borrow._id.toString(),
            userEmail: user.email,
            isOverdue,
            daysDifference,
        };
    }
    catch (error) {
        console.error('Error sending manual reminder email:', error);
        throw error;
    }
};
exports.sendManualReminderEmail = sendManualReminderEmail;
const sendGenericNotificationEmail = async (email, options) => {
    const { subject, title, message, actionUrl, actionLabel = 'Xem chi tiết', footerNote } = options;
    await transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: subject || title || 'Thông báo từ thư viện',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${title ? `<h2 style="color: #0d6efd;">${title}</h2>` : ''}
        <p style="font-size: 15px; line-height: 1.5;">${message}</p>
        ${actionUrl
            ? `<p style="margin: 24px 0;">
                <a href="${actionUrl}" style="background-color: #0d6efd; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
                  ${actionLabel}
                </a>
              </p>`
            : ''}
        <p style="color: #6c757d; font-size: 13px;">
          ${footerNote || 'Đây là email tự động, vui lòng không trả lời.'}
        </p>
      </div>
    `
    });
};
exports.sendGenericNotificationEmail = sendGenericNotificationEmail;
//# sourceMappingURL=emailService.js.map