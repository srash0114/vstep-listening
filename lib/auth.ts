import { User } from "@/types";

/**
 * For HttpOnly Cookie Authentication
 * Token is stored securely in HttpOnly cookie by backend
 * Frontend only needs to store user info in localStorage
 */

/**
 * Get stored user info from localStorage
 * Note: Token is in HttpOnly cookie (not accessible from JS)
 */
export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * Store user info in localStorage
 * Marks user as logged in (token is in HttpOnly cookie)
 */
export const setStoredUser = (user: User): void => {
  if (typeof window !== "undefined") {
    const userWithLoginStatus = { ...user, isLoggedIn: true };
    localStorage.setItem("user", JSON.stringify(userWithLoginStatus));
  }
};

/**
 * Clear user info from localStorage
 * HttpOnly cookie is cleared by backend on logout
 */
export const clearAuth = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

/**
 * Check if user is logged in
 * Determines by checking stored user info
 * (Token verification happens on backend via HttpOnly cookie)
 */
export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  const user = getStoredUser();
  return !!user?.isLoggedIn;
};

