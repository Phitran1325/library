// Utility functions for localStorage management

export const localStorageUtils = {
  // Set current user ID
  setCurrentUserId: (userId: string): void => {
    localStorage.setItem('currentUserId', userId);
  },

  // Get current user ID
  getCurrentUserId: (): string | null => {
    return localStorage.getItem('currentUserId');
  },

  // Remove current user ID
  removeCurrentUserId: (): void => {
    localStorage.removeItem('currentUserId');
  },

  // Set user data
  setUserData: (userData: any): void => {
    localStorage.setItem('userData', JSON.stringify(userData));
  },

  // Get user data
  getUserData: (): any | null => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Remove user data
  removeUserData: (): void => {
    localStorage.removeItem('userData');
  },

  // Clear all auth data
  clearAuthData: (): void => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
  }
};
