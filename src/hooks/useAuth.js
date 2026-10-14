import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth — convenience hook to access the AuthContext.
 *
 * Returns: { user, token, login, logout, updateUser, loading }
 *   - user      : the authenticated user object (or null)
 *   - token     : the current JWT string (or null)
 *   - login     : (userData, jwtToken) => void
 *   - logout    : async () => void  — calls backend to invalidate token before clearing session
 *   - updateUser: (updates) => void — merge partial updates into the user object
 *   - loading   : boolean — true while the stored token is being validated on mount
 *
 * Usage:
 *   const { user, logout, loading } = useAuth();
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
};

export default useAuth;
