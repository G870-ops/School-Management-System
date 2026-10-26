// Smart API & WebSocket URL resolution supporting both local development and Vercel cloud deployments
const isLocalhost = () => {
  if (typeof window === 'undefined') return true;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

export const getApiBaseUrl = () => {
  // 1. If running locally in browser, connect to local backend on port 5001
  if (isLocalhost()) {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl;
    }
    return 'http://localhost:5001/api';
  }

  // 2. Running in cloud/production (e.g. *.vercel.app or custom domain)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  return 'https://school-management-system-backend-bice.vercel.app/api';
};

export const getSocketUrl = () => {
  // 1. If running locally in browser, connect to local backend (which runs the real Socket.io server)
  if (isLocalhost()) {
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return envUrl;
    }
    return 'http://localhost:5001';
  }

  // 2. Running in cloud / production
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  // If explicitly configured with an external dedicated WebSocket service (not vercel.app, since Vercel cannot host WebSockets)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.includes('vercel.app')) {
    return envUrl;
  }
  return envUrl || 'https://school-management-system-backend-bice.vercel.app';
};
