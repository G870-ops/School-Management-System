import React, { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // true until we've validated the stored token

  /**
   * On mount: if a token is stored, verify it with GET /api/auth/me
   * so stale / invalidated JWTs (tokenVersion mismatch) are caught immediately
   * rather than allowing access to protected pages with a bad token.
   */
  useEffect(() => {
    const validateStoredToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axiosInstance.get('/api/auth/me');
        if (data?.success && data?.data) {
          setUser(data.data);
          setToken(storedToken);
        } else {
          // Server rejected token
          _clearSession();
        }
      } catch {
        // 401 / network error — axiosInstance interceptor already removes localStorage items
        _clearSession();
      } finally {
        setLoading(false);
      }
    };

    validateStoredToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Internal helper — wipes all session state without calling the backend */
  const _clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  /**
   * login — called after a successful /api/auth/login or /api/auth/verify-email response
   * @param {object} userData  - the user object from the API response
   * @param {string} jwtToken  - the JWT string to store
   */
  const login = useCallback((userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  }, []);

  /**
   * updateUser — merge partial user data into context (e.g. after profile photo update)
   */
  const updateUser = useCallback((updates) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  /**
   * logout — calls the backend to bump tokenVersion (server-side session invalidation),
   * then clears all client-side session data regardless of the network outcome.
   */
  const logout = useCallback(async () => {
    try {
      // Bump tokenVersion on server so all existing JWTs are immediately invalid
      await axiosInstance.post('/api/auth/logout');
    } catch {
      // Proceed with client-side cleanup even if the network call fails
    } finally {
      _clearSession();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};