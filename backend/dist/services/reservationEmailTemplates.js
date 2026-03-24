"use strict";
/**
 * Email templates cho chức năng đặt sách
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVATION_TEMPLATES = void 0;
exports.RESERVATION_TEMPLATES = {
    CONFIRMATION: {
        subject: 'Xác nhận đặt sách - Library Management System',
        html: (userName, bookTitle, queuePosition, expiresAt) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #28a745;">Đặt sách thành công!</h1>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Bạn đã đặt thành công cuốn sách:</p>
        <h2>${bookTitle}</h2>
        <p><strong>Vị trí trong hàng chờ:</strong> ${queuePosition}</p>
        <p><strong>Thời hạn giữ chỗ:</strong> <span style="color: #dc3545;">${expiresAt.toLocaleDateString('vi-VN')} ${expiresAt.toLocaleTimeString('vi-VN')}</span></p>
        <p>Chúng tôi sẽ thông báo khi sách có sẵn để bạn đến lấy.</p>
      </div>
    `
    },
    AVAILABLE: {
        subject: 'Sách đã có sẵn - Library Management System',
        html: (userName, bookTitle, expiresAt) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #28a745;">Sách đã có sẵn!</h1>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Cuốn sách bạn đặt trước <strong>${bookTitle}</strong> đã có sẵn để bạn đến lấy.</p>
        <p><strong>Vui lòng đến thư viện trước:</strong> <span style="color: #dc3545;">${expiresAt.toLocaleDateString('vi-VN')} ${expiresAt.toLocaleTimeString('vi-VN')}</span></p>
        <p>Nếu bạn không đến lấy trong thời gian này, đặt chỗ sẽ tự động bị hủy.</p>
      </div>
    `
    },
    EXPIRING_SOON: {
        subject: 'Nhắc nhở: Đặt chỗ sắp hết hạn - Library Management System',
        html: (userName, bookTitle, expiresAt) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #ffc107;">Nhắc nhở: Đặt chỗ sắp hết hạn</h1>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Đặt chỗ của bạn cho cuốn sách <strong>${bookTitle}</strong> sẽ hết hạn trong 1 giờ nữa.</p>
        <p><strong>Hết hạn vào:</strong> <span style="color: #dc3545;">${expiresAt.toLocaleDateString('vi-VN')} ${expiresAt.toLocaleTimeString('vi-VN')}</span></p>
        <p>Vui lòng đến thư viện sớm để không bị mất cơ hội.</p>
      </div>
    `
    },
    EXPIRED: {
        subject: 'Thông báo: Đặt chỗ đã hết hạn - Library Management System',
        html: (userName, bookTitle) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #dc3545;">Đặt chỗ đã hết hạn</h1>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Đặt chỗ của bạn cho cuốn sách <strong>${bookTitle}</strong> đã hết hạn do bạn không đến lấy trong thời gian quy định.</p>
        <p>Nếu bạn vẫn muốn mượn sách, vui lòng đặt lại.</p>
      </div>
    `
    },
    NEXT_IN_LINE: {
        subject: 'Thông báo: Bạn là người tiếp theo trong hàng chờ - Library Management System',
        html: (userName, bookTitle, queuePosition, expiresAt) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h1 style="color: #0d6efd;">Bạn là người tiếp theo trong hàng chờ!</h1>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Bạn hiện đang là người tiếp theo trong hàng chờ cho cuốn sách <strong>${bookTitle}</strong>.</p>
        <p><strong>Vị trí trong hàng chờ:</strong> ${queuePosition}</p>
        <p>Chúng tôi sẽ thông báo khi sách có sẵn để bạn đến lấy.</p>
      </div>
    `
    }
};
//# sourceMappingURL=reservationEmailTemplates.js.map