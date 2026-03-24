# Role Rename: USER → READER

## 📝 Tổng Quan Thay Đổi

Đã đổi tên role `USER` → `READER` để phù hợp hơn với ngữ cảnh Library Management System.

---

## ✅ Files Đã Update

### 1. **[src/types/index.ts](src/types/index.ts)**
```typescript
// Before
export const Role = {
  GUEST: 'guest',
  USER: 'user',
  LIBRARIAN: 'librarian',
  ADMIN: 'admin',
} as const;

// After
export const Role = {
  GUEST: 'guest',
  READER: 'reader',      // ✅ Changed
  LIBRARIAN: 'librarian',
  ADMIN: 'admin',
} as const;
```

**ROLE_PERMISSIONS mapping:**
```typescript
// Before
[Role.USER]: [
  Permission.VIEW_BOOKS,
  // ...
],

// After
[Role.READER]: [
  Permission.VIEW_BOOKS,
  // ...
],
```

---

### 2. **[src/contexts/AuthContext/AuthProvider.tsx](src/contexts/AuthContext/AuthProvider.tsx)**
```typescript
// Before
const userWithRole = {
  ...userData,
  role: userData.role || Role.USER  // Default role
};

// After
const userWithRole = {
  ...userData,
  role: userData.role || Role.READER  // ✅ Changed default
};
```

---

### 3. **[src/hooks/usePermission.ts](src/hooks/usePermission.ts)**
```typescript
// Already updated - Hook đã có isReader
return {
  isGuest: userRole === Role.GUEST,
  isReader: userRole === Role.READER,  // ✅ Changed from isUser
  isLibrarian: userRole === Role.LIBRARIAN,
  isAdmin: userRole === Role.ADMIN,
  // ...
};
```

---

### 4. **[src/App.tsx](src/App.tsx)**
```typescript
// Before
{/* Protected User Routes */}
<ProtectedRoute requiredRoles={[Role.USER, Role.LIBRARIAN, Role.ADMIN]}>

// After
{/* Protected Reader Routes */}
<ProtectedRoute requiredRoles={[Role.READER, Role.LIBRARIAN, Role.ADMIN]}>
```

---

### 5. **[AUTHORIZATION_GUIDE.md](AUTHORIZATION_GUIDE.md)**
- Updated all references from `User` → `Reader`
- Updated all `Role.USER` → `Role.READER`
- Updated descriptions and examples

---

## 🔄 Backend API Requirements

Backend cần trả về role đúng format:

```json
POST /api/auth/login
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "fullName": "Nguyen Van A",
      "email": "user@example.com",
      "role": "reader"  // ✅ Changed from "user" to "reader"
    },
    "token": "jwt_token_here"
  }
}
```

### Accepted Role Values:
- ✅ `"guest"` - Khách (chưa đăng nhập)
- ✅ `"reader"` - Độc giả (đã đăng ký)
- ✅ `"librarian"` - Thủ thư
- ✅ `"admin"` - Quản trị viên

---

## 📊 Updated Permission Matrix

| Feature | Guest | Reader | Librarian | Admin |
|---------|:-----:|:------:|:---------:|:-----:|
| Xem sách | ✅ | ✅ | ✅ | ✅ |
| Mượn/Mua sách | ❌ | ✅ | ✅ | ✅ |
| Review sách | ❌ | ✅ | ✅ | ✅ |
| Quản lý sách | ❌ | ❌ | ✅ | ✅ |
| Quản lý khách hàng | ❌ | ❌ | ✅ | ✅ |
| Quản lý nhân viên | ❌ | ❌ | ❌ | ✅ |
| Cài đặt hệ thống | ❌ | ❌ | ❌ | ✅ |

---

## 🧪 Testing Checklist

### Test với role `reader`:
- [ ] Login với role "reader" → success
- [ ] Default role khi backend không trả về → "reader"
- [ ] Access `/profile` → ✅ OK
- [ ] Access `/orders` → ✅ OK
- [ ] Access `/books/:id` và click "Mượn sách" → ✅ OK
- [ ] Access `/admin` → ❌ Redirect to /unauthorized
- [ ] Header hiển thị role "reader" trong dropdown

### Test với role `librarian`:
- [ ] Login với role "librarian" → success
- [ ] Access `/admin` → ✅ OK
- [ ] Access `/admin/books` → ✅ OK
- [ ] Access `/admin/staff` → ❌ Redirect to /unauthorized (Admin only)
- [ ] Header hiển thị "Quản lý thư viện"

### Test với role `admin`:
- [ ] Login với role "admin" → success
- [ ] Access tất cả `/admin/*` routes → ✅ OK
- [ ] Sidebar hiển thị đầy đủ menu items
- [ ] Header hiển thị "Quản trị hệ thống"

---

## 🔍 Backward Compatibility

### Frontend xử lý cũ roles:
```typescript
// Nếu backend vẫn trả về "user" (old format)
const userWithRole = {
  ...userData,
  role: userData.role || Role.READER  // Auto-default to READER
};

// Frontend sẽ auto-convert hoặc accept cả 2:
// "user" → treated as "reader"
// "reader" → correct format
```

### Migration Strategy:
1. **Frontend update trước** (đã xong) ✅
2. **Backend update sau** - Return "reader" instead of "user"
3. **Database migration** - Update existing users' role from "user" → "reader"

---

## 📝 Code Examples

### Check role trong component:
```typescript
import { usePermission } from '@/hooks/usePermission';

const MyComponent = () => {
  const { isReader, isLibrarian, isAdmin } = usePermission();

  if (isReader) {
    return <ReaderFeatures />;
  }

  if (isLibrarian || isAdmin) {
    return <ManagementPanel />;
  }

  return <GuestView />;
};
```

### Protect route:
```typescript
<ProtectedRoute requiredRoles={[Role.READER]}>
  <ProfilePage />
</ProtectedRoute>
```

### Check permission:
```typescript
const { canBorrowBooks } = usePermission();

{canBorrowBooks && <BorrowButton />}
```

---

## ✅ Summary

**Changed:**
- ✅ Role constant: `USER` → `READER`
- ✅ Role value: `'user'` → `'reader'`
- ✅ Hook shortcut: `isUser` → `isReader`
- ✅ Default role: `Role.USER` → `Role.READER`
- ✅ Documentation updated

**Unchanged:**
- ✅ Permission names (vẫn dùng "USER" trong permission comments)
- ✅ API structure
- ✅ Route protection logic
- ✅ Permission checking logic

**Impact:**
- 🟢 **Low risk** - Pure naming change
- 🟢 **Type-safe** - TypeScript sẽ báo lỗi nếu có code nào còn dùng `Role.USER`
- 🟡 **Backend sync needed** - Backend cần trả về `"reader"` thay vì `"user"`

---

**Completed by:** Claude Code
**Date:** 2025-11-06
**Version:** 1.1.0
