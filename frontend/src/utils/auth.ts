/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: auth - handles frontend functionality
 */

/**
 * Centralized Authentication Utilities
 * Eliminates duplicated token handling throughout the application
 */

const TOKEN_KEY = 'token';

export const authUtils = {
  /**
   * Get authentication token from localStorage
   */
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Set authentication token in localStorage
   */
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Remove authentication token from localStorage
   */
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders: () => {
    const token = authUtils.getToken();
    return token ? {
      'Authorization': `Bearer ${token}`
    } : {};
  },

  /**
   * Get complete headers including auth and content-type
   */
  getRequestHeaders: () => ({
    'Content-Type': 'application/json',
    ...authUtils.getAuthHeaders()
  }),

  /**
   * Parse JWT token to get user info (basic parsing, add validation in production)
   */
  getUserFromToken: () => {
    const token = authUtils.getToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }
};

export default authUtils;