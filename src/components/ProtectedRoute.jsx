import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * ProtectedRoute
 * Guards nested routes behind authentication + optional role check.
 *
 * Props:
 *   allowedRoles?: string[]  — if provided, the user's role must be included
 *
 * Behaviour:
 *   - While auth is loading (token being validated on mount) → renders nothing (null)
 *   - No authenticated user → redirect to /login
 *   - User's role not in allowedRoles → 403 error page
 *   - Otherwise → renders child routes via <Outlet />
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  // Wait for token validation to complete before making any routing decisions
  if (loading) return null;

  // Not authenticated → send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role → access denied
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '24px',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          background: '#f8fafc',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #fee2e2',
            borderRadius: '16px',
            padding: '48px 40px',
            maxWidth: '420px',
            boxShadow: '0 4px 24px rgba(220,38,38,0.08)',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#dc2626',
              margin: '0 0 8px 0',
            }}
          >
            403 — Access Denied
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px 0' }}>
            Your account role (<strong>{user.role}</strong>) does not have permission to view this
            dashboard.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#4f46e5',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Authenticated & authorized → render matched child route
  return <Outlet />;
};

export default ProtectedRoute;