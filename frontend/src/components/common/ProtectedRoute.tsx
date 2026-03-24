import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role, Permission } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Role-based protection
  requiredRoles?: Role[];
  // Permission-based protection
  requiredPermissions?: Permission[];
  // Require any permission (OR logic) vs all permissions (AND logic)
  requireAllPermissions?: boolean;
  // Redirect path if unauthorized
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 *
 * Protects routes based on user roles and permissions.
 *
 * @example
 * // Protect route for ADMIN only
 * <ProtectedRoute requiredRoles={[Role.ADMIN]}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Protect route for ADMIN or LIBRARIAN
 * <ProtectedRoute requiredRoles={[Role.ADMIN, Role.LIBRARIAN]}>
 *   <BookManagement />
 * </ProtectedRoute>
 *
 * @example
 * // Protect route with specific permission
 * <ProtectedRoute requiredPermissions={[Permission.MANAGE_BOOKS]}>
 *   <EditBook />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({
  children,
  requiredRoles,
  requiredPermissions,
  requireAllPermissions = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, hasPermission, hasAnyPermission, userRole, isLoading } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('[ProtectedRoute] Auth status:', {
    isAuthenticated,
    userRole,
    requiredRoles,
    path: location.pathname,
    isLoading
  });

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-light">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = hasRole(requiredRoles);
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission-based access
  if (requiredPermissions && requiredPermissions.length > 0) {
    let hasRequiredPermission = false;

    if (requireAllPermissions) {
      // User must have ALL specified permissions
      hasRequiredPermission = requiredPermissions.every(permission =>
        hasPermission(permission)
      );
    } else {
      // User must have ANY of the specified permissions
      hasRequiredPermission = hasAnyPermission(requiredPermissions);
    }

    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authorized
  return <>{children}</>;
};

export default ProtectedRoute;
