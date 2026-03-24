import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { Role, Permission, ROLE_PERMISSIONS, type AuthContextType, type User } from '../../types';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Normalize role string to Role type
 * Handles case-insensitive role matching from backend
 */
const normalizeRole = (roleString: string | undefined): Role => {
  if (!roleString) return Role.GUEST;

  const normalized = String(roleString).toLowerCase().trim();

  switch (normalized) {
    case 'admin':
      return Role.ADMIN;
    case 'librarian':
      return Role.LIBRARIAN;
    case 'reader':
      return Role.READER;
    default:
      return Role.GUEST;
  }
};

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on app startup
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // ✅ Kiểm tra isActive - Nếu tài khoản bị khóa, logout ngay
        if (parsedUser.isActive === false) {
          console.warn('[AuthProvider] User account is locked (isActive: false). Logging out...');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsLoading(false);
          return;
        }

        // Normalize role when loading from storage
        if (parsedUser.role) {
          parsedUser.role = normalizeRole(parsedUser.role);
        }
        setUser(parsedUser);
        setToken(savedToken);
      } catch (error) {
        console.error('[AuthProvider] Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, tokenString: string) => {
    // ✅ Kiểm tra isActive trước khi login
    if (userData.isActive === false) {
      console.error('[AuthProvider] Cannot login: User account is locked (isActive: false)');
      throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ admin.');
    }

    // Normalize role before saving
    const normalizedUser = {
      ...userData,
      role: normalizeRole(userData.role as unknown as string),
    };

    console.log('[AuthProvider] Login:', {
      originalRole: userData.role,
      normalizedRole: normalizedUser.role,
      user: normalizedUser,
      isActive: normalizedUser.isActive,
    });

    setUser(normalizedUser);
    setToken(tokenString);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', tokenString);
  };

  const logout = () => {
    console.log('[AuthProvider] Logout');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Get current user role
  const userRole: Role = user?.role || Role.GUEST;

  // Check if user has specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  // Check if user has specific role(s)
  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    const result = roleArray.includes(userRole);

    console.log('[AuthProvider] hasRole check:', {
      userRole,
      requiredRoles: roleArray,
      result,
    });

    return result;
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    userRole,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;