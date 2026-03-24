import { useAuth } from '../contexts/AuthContext';
import { Role, Permission } from '../types';

/**
 * Custom hook for permission checking
 *
 * @example
 * const { canManageBooks, canBorrowBooks, isAdmin } = usePermission();
 *
 * if (canManageBooks) {
 *   return <EditBookButton />
 * }
 */
export const usePermission = () => {
  const { hasPermission, hasAnyPermission, hasRole, userRole } = useAuth();

  return {
    // Direct access to auth functions
    hasPermission,
    hasAnyPermission,
    hasRole,
    userRole,

    // Role checks
    isGuest: userRole === Role.GUEST,
    isReader: userRole === Role.READER,
    isLibrarian: userRole === Role.LIBRARIAN,
    isAdmin: userRole === Role.ADMIN,

    // Permission shortcuts for common actions
    canViewBooks: hasPermission(Permission.VIEW_BOOKS),
    canBorrowBooks: hasPermission(Permission.BORROW_BOOKS),
    canPurchaseBooks: hasPermission(Permission.PURCHASE_BOOKS),
    canReviewBooks: hasPermission(Permission.REVIEW_BOOKS),
    canManageBooks: hasPermission(Permission.MANAGE_BOOKS),

    canViewProfile: hasPermission(Permission.VIEW_PROFILE),
    canEditProfile: hasPermission(Permission.EDIT_PROFILE),
    canViewOrders: hasPermission(Permission.VIEW_ORDERS),

    canManageStaff: hasPermission(Permission.MANAGE_STAFF),
    canManageInventory: hasPermission(Permission.MANAGE_INVENTORY),
    canViewReports: hasPermission(Permission.VIEW_REPORTS),
    canManageSettings: hasPermission(Permission.MANAGE_SETTINGS),

    canManageBorrows: hasPermission(Permission.MANAGE_BORROWS),
    canManageReturns: hasPermission(Permission.MANAGE_RETURNS),
    canViewCustomers: hasPermission(Permission.VIEW_CUSTOMERS),

    // Combined permission checks
    canAccessAdminPanel: hasAnyPermission([
      Permission.MANAGE_STAFF,
      Permission.VIEW_REPORTS,
      Permission.MANAGE_SETTINGS,
    ]),

    canAccessLibrarianPanel: hasAnyPermission([
      Permission.MANAGE_BOOKS,
      Permission.MANAGE_BORROWS,
      Permission.MANAGE_RETURNS,
      Permission.MANAGE_INVENTORY,
    ]),

    // Check if user can perform book actions (borrow or purchase)
    canPerformBookActions: hasAnyPermission([
      Permission.BORROW_BOOKS,
      Permission.PURCHASE_BOOKS,
    ]),
  };
};

export default usePermission;
