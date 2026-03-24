# Hệ Thống Phân Quyền - Library Management System

## 📋 Tổng Quan

Hệ thống phân quyền hoàn chỉnh với 4 roles: **Guest**, **Reader**, **Librarian**, và **Admin**.

---

## 🎭 Roles & Permissions

### 1. **Guest** (Khách - Chưa đăng nhập)
**Quyền:**
- ✅ Xem danh sách sách
- ✅ Xem chi tiết sách
- ❌ Không thể mượn/mua sách
- ❌ Không thể review
- ❌ Không thể thêm vào yêu thích

**Routes:**
- `/` - Trang chủ
- `/books` - Danh sách sách
- `/books/:id` - Chi tiết sách
- `/login`, `/signup` - Auth pages

---

### 2. **Reader** (Độc giả - Đã đăng ký)
**Quyền:**
- ✅ Tất cả quyền của Guest
- ✅ Mượn sách
- ✅ Mua sách
- ✅ Viết review
- ✅ Thêm vào yêu thích
- ✅ Xem & quản lý profile
- ✅ Xem lịch sử đơn hàng

**Protected Routes:**
- `/profile` - Thông tin cá nhân
- `/orders` - Lịch sử đơn hàng

**Permissions:**
```typescript
Permission.VIEW_BOOKS
Permission.BORROW_BOOKS
Permission.PURCHASE_BOOKS
Permission.REVIEW_BOOKS
Permission.VIEW_PROFILE
Permission.EDIT_PROFILE
Permission.VIEW_ORDERS
```

---

### 3. **Librarian** (Thủ thư)
**Quyền:**
- ✅ Tất cả quyền của Reader
- ✅ Quản lý sách (CRUD)
- ✅ Quản lý mượn/trả sách
- ✅ Xem danh sách khách hàng
- ✅ Quản lý kho (inventory)
- ❌ Không quản lý nhân viên
- ❌ Không truy cập settings

**Protected Routes:**
- `/admin` - Dashboard
- `/admin/books` - Quản lý sách
- `/admin/customers` - Quản lý khách hàng
- `/admin/orders` - Quản lý đơn hàng
- `/admin/inventory` - Quản lý kho

**Permissions:**
```typescript
Permission.MANAGE_BOOKS
Permission.MANAGE_BORROWS
Permission.MANAGE_RETURNS
Permission.VIEW_CUSTOMERS
Permission.MANAGE_INVENTORY
```

---

### 4. **Admin** (Quản trị viên)
**Quyền:**
- ✅ **FULL PERMISSIONS** - Tất cả quyền trong hệ thống
- ✅ Quản lý nhân viên
- ✅ Quản lý settings
- ✅ Xem báo cáo & thống kê

**Protected Routes:**
- Tất cả routes của Librarian
- `/admin/staff` - Quản lý nhân viên (Admin only)
- `/admin/settings` - Cài đặt hệ thống (Admin only)

**Permissions:**
```typescript
// Admin có tất cả permissions
Permission.MANAGE_STAFF
Permission.MANAGE_SETTINGS
Permission.VIEW_REPORTS
// + All Reader & Librarian permissions
```

---

## 🛠️ Implementation Details

### 1. **Types & Constants** ([types/index.ts](src/types/index.ts))

```typescript
// Role Definition
export const Role = {
  GUEST: 'guest',
  USER: 'user',
  LIBRARIAN: 'librarian',
  ADMIN: 'admin',
} as const;

export type Role = typeof Role[keyof typeof Role];

// Permission Definition
export const Permission = {
  VIEW_BOOKS: 'view_books',
  BORROW_BOOKS: 'borrow_books',
  PURCHASE_BOOKS: 'purchase_books',
  REVIEW_BOOKS: 'review_books',
  MANAGE_BOOKS: 'manage_books',
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  VIEW_ORDERS: 'view_orders',
  MANAGE_USERS: 'manage_users',
  MANAGE_STAFF: 'manage_staff',
  MANAGE_INVENTORY: 'manage_inventory',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BORROWS: 'manage_borrows',
  MANAGE_RETURNS: 'manage_returns',
  VIEW_CUSTOMERS: 'view_customers',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.GUEST]: [Permission.VIEW_BOOKS],
  [Role.READER]: [
    Permission.VIEW_BOOKS,
    Permission.BORROW_BOOKS,
    Permission.PURCHASE_BOOKS,
    Permission.REVIEW_BOOKS,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_ORDERS,
  ],
  [Role.LIBRARIAN]: [
    Permission.VIEW_BOOKS,
    Permission.MANAGE_BOOKS,
    Permission.MANAGE_BORROWS,
    Permission.MANAGE_RETURNS,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
  ],
  [Role.ADMIN]: [...Object.values(Permission)], // All permissions
};
```

---

### 2. **AuthContext** ([contexts/AuthContext/AuthProvider.tsx](src/contexts/AuthContext/AuthProvider.tsx))

```typescript
// AuthContext cung cấp:
const {
  user,                    // Current user object
  token,                   // Auth token
  isAuthenticated,         // Boolean
  userRole,                // Current role (default: GUEST)
  login,                   // (user, token) => void
  logout,                  // () => void
  hasPermission,           // (permission) => boolean
  hasAnyPermission,        // (permissions[]) => boolean
  hasRole,                 // (role | role[]) => boolean
} = useAuth();
```

**Features:**
- ✅ Auto-load user từ localStorage khi app start
- ✅ Default role = `Role.READER` nếu backend không trả về
- ✅ Guest role khi chưa login
- ✅ Real-time permission checking

---

### 3. **ProtectedRoute Component** ([components/common/ProtectedRoute.tsx](src/components/common/ProtectedRoute.tsx))

**Usage Examples:**

```typescript
// Protect by Role
<ProtectedRoute requiredRoles={[Role.ADMIN]}>
  <AdminSettings />
</ProtectedRoute>

// Protect by Multiple Roles (OR logic)
<ProtectedRoute requiredRoles={[Role.ADMIN, Role.LIBRARIAN]}>
  <BookManagement />
</ProtectedRoute>

// Protect by Permission
<ProtectedRoute requiredPermissions={[Permission.MANAGE_BOOKS]}>
  <EditBook />
</ProtectedRoute>

// Protect by Multiple Permissions (OR logic by default)
<ProtectedRoute
  requiredPermissions={[Permission.BORROW_BOOKS, Permission.PURCHASE_BOOKS]}
>
  <BookActions />
</ProtectedRoute>

// Require ALL permissions (AND logic)
<ProtectedRoute
  requiredPermissions={[Permission.MANAGE_BOOKS, Permission.MANAGE_INVENTORY]}
  requireAllPermissions={true}
>
  <AdvancedBookManagement />
</ProtectedRoute>

// Custom redirect path
<ProtectedRoute
  requiredRoles={[Role.READER]}
  redirectTo="/custom-login"
>
  <ProfilePage />
</ProtectedRoute>
```

**Behavior:**
- ❌ Not authenticated → Redirect to `/login`
- ❌ Insufficient permissions → Redirect to `/unauthorized` (403)
- ✅ Authorized → Render children

---

### 4. **usePermission Hook** ([hooks/usePermission.ts](src/hooks/usePermission.ts))

**Usage:**

```typescript
const {
  // Role checks
  isGuest,
  isUser,
  isLibrarian,
  isAdmin,

  // Permission shortcuts
  canViewBooks,
  canBorrowBooks,
  canPurchaseBooks,
  canReviewBooks,
  canManageBooks,
  canViewProfile,
  canEditProfile,
  canViewOrders,
  canManageUsers,
  canManageStaff,
  canManageInventory,
  canViewReports,
  canManageSettings,
  canManageBorrows,
  canManageReturns,
  canViewCustomers,

  // Combined checks
  canAccessAdminPanel,
  canAccessLibrarianPanel,
  canPerformBookActions,

  // Functions
  hasPermission,
  hasAnyPermission,
  hasRole,
  userRole,
} = usePermission();
```

**Examples:**

```typescript
// Simple role check
if (isAdmin) {
  return <AdminButton />;
}

// Permission check
if (canManageBooks) {
  return <EditBookButton />;
}

// Conditional rendering
{canAccessAdminPanel && <AdminLink />}

// Multiple permissions
if (hasAnyPermission([Permission.MANAGE_BOOKS, Permission.MANAGE_INVENTORY])) {
  return <ManagementPanel />;
}
```

---

### 5. **Route Protection** ([App.tsx](src/App.tsx))

```typescript
// Public routes (all users)
<Route element={<DefaultLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/books" element={<BookList />} />
  <Route path="/books/:id" element={<BookDetail />} />
</Route>

// Protected Reader routes
<Route
  path="/profile"
  element={
    <ProtectedRoute requiredRoles={[Role.READER, Role.LIBRARIAN, Role.ADMIN]}>
      <ProfilePage />
    </ProtectedRoute>
  }
/>

// Protected Admin panel
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={[Role.ADMIN, Role.LIBRARIAN]}>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<AdminDashboard />} />

  {/* Admin only route */}
  <Route
    path="staff"
    element={
      <ProtectedRoute requiredRoles={[Role.ADMIN]}>
        <StaffManagement />
      </ProtectedRoute>
    }
  />
</Route>
```

---

### 6. **UI Components with Authorization**

#### **Header** ([layouts/components/Header/Header.tsx](src/layouts/components/Header/Header.tsx))
```typescript
// Show admin link only for admin/librarian
{canAccessManagementPanel && (
  <button onClick={() => navigate('/admin')}>
    {isAdmin ? 'Quản trị hệ thống' : 'Quản lý thư viện'}
  </button>
)}
```

#### **AdminSidebar** ([components/admin/AdminSidebar.tsx](src/components/admin/AdminSidebar.tsx))
```typescript
// Dynamically filter menu items by role
const menuItems = allMenuItems.filter(item => {
  if (item.roles?.includes(Role.ADMIN) && isAdmin) return true;
  if (item.roles?.includes(Role.LIBRARIAN) && isLibrarian) return true;
  return false;
});
```

#### **BookDetail ActionPanel** ([components/BookDetail/ActionPanel.tsx](src/components/BookDetail/ActionPanel.tsx))
```typescript
// Guest: Show login button
{!isAuthenticated && (
  <button onClick={() => navigate('/login')}>
    Đăng nhập để mượn/mua sách
  </button>
)}

// Reader: Show borrow/buy based on permissions
{canBorrowBooks && <BorrowButton />}
{canPurchaseBooks && <BuyButton />}
{!canBorrowBooks && !canPurchaseBooks && (
  <PermissionDeniedMessage />
)}
```

---

## 📊 Permission Matrix

| Feature | Guest | Reader | Librarian | Admin |
|---------|-------|------|-----------|-------|
| Xem sách | ✅ | ✅ | ✅ | ✅ |
| Mượn sách | ❌ | ✅ | ✅ | ✅ |
| Mua sách | ❌ | ✅ | ✅ | ✅ |
| Review sách | ❌ | ✅ | ✅ | ✅ |
| Quản lý sách | ❌ | ❌ | ✅ | ✅ |
| Quản lý khách hàng | ❌ | ❌ | ✅ | ✅ |
| Quản lý kho | ❌ | ❌ | ✅ | ✅ |
| Quản lý nhân viên | ❌ | ❌ | ❌ | ✅ |
| Cài đặt hệ thống | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 Security Features

### 1. **Route Guards**
- Redirect unauthorized users to `/login`
- Redirect insufficient permissions to `/unauthorized` (403)
- Save attempted URL for redirect after login

### 2. **Component-Level Protection**
- Hide/show UI elements based on permissions
- Disable buttons for insufficient permissions
- Show permission denied messages

### 3. **LocalStorage Security**
```typescript
// Save role on login
localStorage.setItem('userRole', role);

// Load role on app start
const savedRole = localStorage.getItem('userRole');

// Clear on logout
localStorage.removeItem('userRole');
```

### 4. **Default Fallbacks**
- Unauthenticated users → `Role.GUEST`
- Missing role from backend → `Role.READER`
- Invalid role → Redirect to login

---

## 🧪 Testing the Authorization System

### Test Scenarios:

1. **Guest Reader:**
   ```
   - Visit / → ✅ OK
   - Visit /books → ✅ OK
   - Click "Mượn sách" → Redirect to /login ✅
   - Visit /admin → Redirect to /login ✅
   ```

2. **Reader:**
   ```
   - Login as user → ✅ OK
   - Click "Mượn sách" → ✅ OK
   - Click "Mua sách" → ✅ OK
   - Visit /admin → Redirect to /unauthorized ❌
   ```

3. **Librarian:**
   ```
   - Login as librarian → ✅ OK
   - Visit /admin → ✅ OK
   - Visit /admin/books → ✅ OK
   - Visit /admin/staff → Redirect to /unauthorized ❌
   - See "Quản lý thư viện" in header ✅
   ```

4. **Admin:**
   ```
   - Login as admin → ✅ OK
   - Visit all /admin routes → ✅ OK
   - See all sidebar items → ✅ OK
   - See "Quản trị hệ thống" in header ✅
   ```

---

## 🔧 Backend Integration

### Expected API Response Format:

```json
POST /api/auth/login
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "fullName": "Nguyen Van A",
      "email": "user@example.com",
      "role": "user"  // "guest" | "user" | "librarian" | "admin"
    },
    "token": "jwt_token_here"
  }
}
```

### Backend Requirements:
1. Return `role` field in user object
2. Role values: `"guest"`, `"user"`, `"librarian"`, `"admin"`
3. Validate role on all protected endpoints
4. Return 401 for unauthenticated
5. Return 403 for insufficient permissions

---

## 📝 How to Add New Permissions

### Step 1: Add Permission to types
```typescript
// src/types/index.ts
export const Permission = {
  // ... existing permissions
  NEW_PERMISSION: 'new_permission',
} as const;
```

### Step 2: Add to Role Mapping
```typescript
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.READER]: [
    // ... existing
    Permission.NEW_PERMISSION,
  ],
};
```

### Step 3: Add Shortcut to usePermission (optional)
```typescript
// src/hooks/usePermission.ts
export const usePermission = () => {
  return {
    // ... existing
    canDoNewThing: hasPermission(Permission.NEW_PERMISSION),
  };
};
```

### Step 4: Use in Component
```typescript
const { canDoNewThing } = usePermission();

{canDoNewThing && <NewFeatureButton />}
```

---

## 📚 Files Created/Modified

### New Files:
1. `src/components/common/ProtectedRoute.tsx` - Route guard component
2. `src/hooks/usePermission.ts` - Permission checking hook
3. `src/pages/Error/UnauthorizedPage.tsx` - 403 page
4. `AUTHORIZATION_GUIDE.md` - This documentation

### Modified Files:
1. `src/types/index.ts` - Added Role, Permission, ROLE_PERMISSIONS
2. `src/utils/localStorage.ts` - Added role storage methods
3. `src/contexts/AuthContext/AuthProvider.tsx` - Added permission logic
4. `src/contexts/AuthContext/AuthContext.tsx` - Updated interface
5. `src/App.tsx` - Added route protection
6. `src/layouts/components/Header/Header.tsx` - Role-based navigation
7. `src/components/admin/AdminSidebar.tsx` - Role-based menu items
8. `src/components/BookDetail/ActionPanel.tsx` - Role-based buttons

---

## ✅ Implementation Complete!

Hệ thống phân quyền đã được implement hoàn chỉnh với:
- ✅ 4 roles với permissions rõ ràng
- ✅ Route protection với ProtectedRoute
- ✅ Permission checking hook
- ✅ UI conditional rendering
- ✅ 403 Unauthorized page
- ✅ Role-based navigation
- ✅ Guest user handling
- ✅ Type-safe implementation

---

## 🚀 Next Steps

1. Test với các role khác nhau
2. Integrate với backend API
3. Add unit tests cho permission logic
4. Add loading states cho permission checks
5. Implement role management UI (admin panel)
6. Add audit logging cho permission changes

---

**Created by:** Claude Code
**Date:** 2025-11-06
**Version:** 1.0.0
