# Hệ Thống Tự Động Gửi Nhắc Nhở Trả Sách

## 📋 Tổng Quan

Hệ thống tự động gửi nhắc nhở trả sách với các tính năng:
- ✅ Tự động gửi nhắc nhở trước ngày đến hạn (3 ngày và 1 ngày trước)
- ✅ Tự động gửi nhắc nhở khi quá hạn (mỗi ngày)
- ✅ Gửi qua nhiều kênh: Email, Notification trong hệ thống, WebSocket (real-time)
- ✅ Tránh spam với cơ chế tracking reminders đã gửi
- ✅ API đầy đủ để quản lý và theo dõi reminders
- ✅ Validation chặt chẽ cho tất cả endpoints

---

## 🏗️ Kiến Trúc

### Models

#### 1. BorrowReminder
Model để track các reminders đã gửi, tránh duplicate và spam.

**Fields:**
- `borrow`: ID phiếu mượn
- `user`: ID người dùng
- `type`: Loại reminder (`BEFORE_DUE`, `OVERDUE`, `MANUAL`)
- `status`: Trạng thái (`PENDING`, `SENT`, `FAILED`)
- `scheduledDate`: Ngày dự kiến gửi
- `sentAt`: Ngày thực tế gửi
- `daysUntilDue`: Số ngày còn lại đến hạn
- `daysOverdue`: Số ngày quá hạn
- `emailSent`, `notificationSent`, `websocketSent`: Trạng thái gửi từng kênh
- `retryCount`, `maxRetries`: Cơ chế retry

#### 2. Notification (Updated)
Đã thêm các type mới:
- `BORROW_REMINDER`: Nhắc nhở trước hạn
- `OVERDUE_WARNING`: Cảnh báo quá hạn

### Services

#### reminderService.ts
Các hàm chính:

1. **`createReminderRecord()`**: Tạo reminder record trong DB
2. **`sendReminder()`**: Gửi reminder qua tất cả kênh
3. **`scheduleBeforeDueReminders()`**: Tạo reminders cho sách sắp đến hạn
4. **`scheduleOverdueReminders()`**: Tạo reminders cho sách quá hạn
5. **`processPendingReminders()`**: Gửi các reminders đã đến lúc
6. **`sendManualReminder()`**: Gửi reminder thủ công (từ librarian/admin)

### Cron Jobs

#### borrowCronJobs.ts (Updated)

**Daily Job (00:00):**
- Cập nhật phí phạt trễ hạn
- Gửi email nhắc nhở (giữ lại hàm cũ để tương thích)
- Xử lý vi phạm và suspend

**Hourly Job (mỗi giờ):**
- Tạo reminders mới cho borrows sắp đến hạn
- Tạo reminders mới cho borrows quá hạn
- Gửi các reminders đã đến lúc gửi
- Expire reservations

---

## 🔌 API Endpoints

### Base URL: `/api/reminders`

Tất cả endpoints đều yêu cầu authentication.

### 1. GET `/api/reminders`

Lấy danh sách reminders.

**Query Parameters:**
- `page` (number, default: 1): Số trang
- `limit` (number, default: 20, max: 100): Số lượng mỗi trang
- `status` (string, optional): Filter theo status (`PENDING`, `SENT`, `FAILED`)
- `type` (string, optional): Filter theo type (`BEFORE_DUE`, `OVERDUE`, `MANUAL`)
- `borrowId` (string, optional): Filter theo ID phiếu mượn
- `userId` (string, optional): Filter theo ID người dùng (chỉ Admin/Librarian)

**Permissions:**
- Reader: Chỉ xem reminders của mình
- Admin/Librarian: Xem tất cả hoặc filter theo user

**Response:**
```json
{
  "success": true,
  "data": {
    "reminders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. POST `/api/reminders/manual/:borrowId`

Gửi nhắc nhở thủ công.

**Permissions:** Admin, Librarian

**Path Parameters:**
- `borrowId` (string, required): ID phiếu mượn

**Body (optional):**
```json
{
  "customMessage": "Tin nhắn tùy chỉnh (tối đa 500 ký tự)"
}
```

**Validation:**
- `borrowId` phải là ObjectId hợp lệ
- `customMessage` (nếu có) phải là string, tối đa 500 ký tự
- Borrow phải tồn tại và chưa trả

**Response:**
```json
{
  "success": true,
  "message": "Đã gửi nhắc nhở thành công",
  "data": {
    "success": true,
    "reminderId": "...",
    "emailSent": true,
    "notificationSent": true,
    "websocketSent": true
  }
}
```

### 3. GET `/api/reminders/stats`

Lấy thống kê reminders.

**Permissions:** Admin, Librarian

**Query Parameters:**
- `startDate` (string, optional): Ngày bắt đầu (ISO format)
- `endDate` (string, optional): Ngày kết thúc (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "pending": 50,
    "sent": 900,
    "failed": 50,
    "byType": {
      "BEFORE_DUE": 600,
      "OVERDUE": 350,
      "MANUAL": 50
    },
    "byStatus": {
      "PENDING": 50,
      "SENT": 900,
      "FAILED": 50
    }
  }
}
```

### 4. POST `/api/reminders/process`

Xử lý reminders đang chờ (trigger thủ công).

**Permissions:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Đã xử lý reminders",
  "data": {
    "processed": 10,
    "success": 9,
    "failed": 1
  }
}
```

### 5. POST `/api/reminders/schedule`

Tạo lịch reminders mới (trigger thủ công).

**Permissions:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Đã tạo lịch reminders",
  "data": {
    "beforeDue": 50,
    "overdue": 20,
    "total": 70
  }
}
```

---

## ⚙️ Cấu Hình

### Reminder Config

Trong `reminderService.ts`:

```typescript
const DEFAULT_CONFIG: ReminderConfig = {
  beforeDueDays: [3, 1],        // Gửi 3 ngày trước và 1 ngày trước
  overdueInterval: 1,           // Gửi mỗi ngày khi quá hạn
  maxRemindersPerBorrow: 10     // Tối đa 10 lần nhắc nhở cho mỗi borrow
};
```

Có thể tùy chỉnh khi gọi:
```typescript
await scheduleBeforeDueReminders({
  beforeDueDays: [7, 3, 1],  // Gửi 7, 3, và 1 ngày trước
  overdueInterval: 2,        // Gửi cách ngày khi quá hạn
  maxRemindersPerBorrow: 5
});
```

---

## 🔄 Luồng Hoạt Động

### 1. Tự Động Tạo Reminders

**Cron Job (mỗi giờ):**
1. Tìm tất cả borrows có status `Borrowed` và `dueDate` trong tương lai
2. Tính số ngày còn lại đến hạn
3. Nếu còn đúng 3 ngày hoặc 1 ngày → Tạo reminder `BEFORE_DUE`
4. Tìm tất cả borrows quá hạn (status `Borrowed`/`Overdue`, `dueDate` < now)
5. Tính số ngày quá hạn
6. Nếu đúng interval (ví dụ: mỗi ngày) → Tạo reminder `OVERDUE`

### 2. Gửi Reminders

**Cron Job (mỗi giờ):**
1. Tìm tất cả reminders có `status = PENDING` và `scheduledDate <= now`
2. Với mỗi reminder:
   - Gửi email
   - Tạo notification trong DB
   - Gửi WebSocket notification (nếu user đang online)
   - Cập nhật status thành `SENT` hoặc `FAILED`

### 3. Tránh Spam

- **Unique Index**: Mỗi borrow chỉ có 1 reminder cùng type trong cùng ngày
- **Max Retries**: Tối đa 3 lần retry nếu gửi thất bại
- **Max Reminders**: Tối đa 10 reminders cho mỗi borrow (có thể config)

---

## 📧 Email Templates

### Before Due Reminder
- **Subject**: "Nhắc nhở: Sách sắp đến hạn trả - {bookTitle}"
- **Content**: Thông báo số ngày còn lại, hạn trả, lời nhắc trả đúng hạn

### Overdue Warning
- **Subject**: "⚠️ Sách đã quá hạn - {bookTitle}"
- **Content**: Thông báo số ngày quá hạn, phí phạt hiện tại, lời nhắc trả sớm

### Manual Reminder
- **Subject**: "Nhắc nhở: Sách sắp đến hạn trả" hoặc "⚠️ Nhắc nhở: Sách đã quá hạn"
- **Content**: Có thể tùy chỉnh message từ librarian/admin

---

## 🔔 Notification Types

### BORROW_REMINDER
- Gửi khi sách sắp đến hạn
- Data: `borrowId`, `bookId`, `bookTitle`, `daysUntilDue`

### OVERDUE_WARNING
- Gửi khi sách quá hạn
- Data: `borrowId`, `bookId`, `bookTitle`, `daysOverdue`

---

## 🧪 Testing

### Test Manual Reminder
```bash
POST /api/reminders/manual/{borrowId}
Authorization: Bearer {librarian_token}
Body: {
  "customMessage": "Vui lòng trả sách sớm nhất có thể"
}
```

### Test Process Reminders
```bash
POST /api/reminders/process
Authorization: Bearer {admin_token}
```

### Test Schedule Reminders
```bash
POST /api/reminders/schedule
Authorization: Bearer {admin_token}
```

---

## 📊 Monitoring

### Xem Thống Kê
```bash
GET /api/reminders/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {admin_token}
```

### Xem Reminders Của User
```bash
GET /api/reminders?status=PENDING&type=BEFORE_DUE
Authorization: Bearer {user_token}
```

---

## 🛡️ Validation Rules

### BorrowId
- Phải là ObjectId hợp lệ (24 ký tự hex)
- Borrow phải tồn tại
- Borrow phải chưa trả (status !== 'Returned')

### CustomMessage
- Optional
- Nếu có: phải là string, tối đa 500 ký tự

### Pagination
- `page`: >= 1
- `limit`: 1-100

### Date Filters
- ISO format (YYYY-MM-DD hoặc ISO 8601)
- Phải là date hợp lệ

### Status/Type Filters
- Phải là một trong các giá trị enum hợp lệ

---

## 🔒 Security

- Tất cả endpoints yêu cầu authentication
- Reader chỉ xem reminders của mình
- Admin/Librarian có thể xem tất cả và gửi manual reminders
- Chỉ Admin mới có quyền trigger process/schedule (để test)

---

## 📝 Notes

- Reminders được tạo tự động mỗi giờ
- Reminders được gửi tự động mỗi giờ
- Email gửi qua SMTP (cấu hình trong `.env`)
- WebSocket chỉ gửi nếu user đang online
- Notification luôn được tạo trong DB (ngay cả khi email/websocket fail)

---

**Created:** 2024
**Version:** 1.0.0

