// Smart API & WebSocket URL resolution with auto-fallback for Vercel deployments
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // If explicitly configured to a valid remote URL, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  // If running in browser on a production domain (e.g. *.vercel.app)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://school-management-system-backend-bice.vercel.app/api';
  }
  return envUrl || 'http://localhost:5001/api';
};

export const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://school-management-system-backend-bice.vercel.app';
  }
  return envUrl || 'http://localhost:5001';
};
