# Profile Page

Trang profile dành cho user với đầy đủ chức năng cập nhật thông tin cá nhân.

## Tính năng

### 1. Profile Information Tab

- **Cập nhật thông tin cá nhân**: Họ tên, số điện thoại, ngày sinh, giới tính
- **Cập nhật địa chỉ**: Địa chỉ, quận/huyện, thành phố
- **Upload avatar**: Thay đổi ảnh đại diện
- **Form validation**: Kiểm tra dữ liệu đầu vào

### 2. Security Tab

- **Đổi mật khẩu**: Thay đổi mật khẩu với xác thực mật khẩu hiện tại
- **Validation**: Kiểm tra mật khẩu mới và xác nhận mật khẩu

### 3. Settings Tab

- **Email Notifications**: Bật/tắt thông báo email
- **SMS Notifications**: Bật/tắt thông báo SMS
- **Two-Factor Authentication**: Bật/tắt xác thực 2 yếu tố

## Cấu trúc dữ liệu

### UserProfile Interface

```typescript
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  address?: string;
  district?: string;
  city?: string;
  avatar?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}
```

### UpdateProfileDTO Interface

```typescript
interface UpdateProfileDTO {
  fullName?: string;
  phone?: string;
  address?: string;
  district?: string;
  city?: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
}
```

## API Services

### profileApi.getCurrentUserProfile()

- Lấy thông tin profile của user hiện tại
- Trả về: `ApiResponse<UserProfile>`

### profileApi.updateProfile(userId, updateData)

- Cập nhật thông tin profile
- Parameters: `userId: string`, `updateData: UpdateProfileDTO`
- Trả về: `ApiResponse<UserProfile>`

### profileApi.uploadAvatar(userId, file)

- Upload avatar mới
- Parameters: `userId: string`, `file: File`
- Trả về: `ApiResponse<{ avatarUrl: string }>`

### profileApi.changePassword(userId, passwordData)

- Đổi mật khẩu
- Parameters: `userId: string`, `passwordData: { currentPassword: string; newPassword: string }`
- Trả về: `ApiResponse<boolean>`

## Demo Data

Trang sử dụng dữ liệu mẫu từ `db.json` với 6 users:

- Admin (admin@gmail.com)
- Reader (reader1@gmail.com) 
- Users (4 users khác)

## Cách sử dụng

1. **Chọn user**: Sử dụng UserSelector component ở góc trên bên phải
2. **Cập nhật profile**: Chuyển sang tab "Profile Information" và chỉnh sửa thông tin
3. **Đổi mật khẩu**: Chuyển sang tab "Security" để đổi mật khẩu
4. **Cài đặt**: Chuyển sang tab "Settings" để cấu hình thông báo

## Responsive Design

- **Mobile**: Layout 1 cột, form fields stack vertically
- **Tablet**: Layout 2 cột cho form fields
- **Desktop**: Layout tối ưu với sidebar navigation

## Styling

Sử dụng Tailwind CSS với:

- **Colors**: Blue theme cho primary actions, red cho danger actions
- **Spacing**: Consistent padding và margins
- **Typography**: Clear hierarchy với font weights
- **Interactive**: Hover states và focus states
- **Loading**: Spinner animations cho async operations

