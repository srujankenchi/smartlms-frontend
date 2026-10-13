/**
 * Central API & Environment Configuration
 * Supports local development, custom env vars, and production deployments on Vercel / Render.
 */

// Base API endpoint URL (e.g. "https://smartlms-backend.onrender.com/api" or "http://localhost:8008/api")
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8008/api';

// Base backend host without the '/api' suffix
export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  API_BASE_URL.replace(/\/api\/?$/, '') ||
  'http://localhost:8008';

/**
 * Derives the appropriate WebSocket URL.
 * Automatically chooses 'wss://' for secure HTTPS production environments and 'ws://' for HTTP local dev.
 */
export const getWebSocketUrl = (endpointPath = '/ws/chat') => {
  if (import.meta.env.VITE_WS_URL) {
    const customWs = import.meta.env.VITE_WS_URL.replace(/\/$/, '');
    const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    return `${customWs}${cleanPath}`;
  }

  const cleanBase = BACKEND_BASE_URL.replace(/\/$/, '');
  const wsProtocol = cleanBase.startsWith('https://') ? 'wss://' : 'ws://';
  const hostWithoutProtocol = cleanBase.replace(/^https?:\/\//, '');
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  return `${wsProtocol}${hostWithoutProtocol}${cleanPath}`;
};

/**
 * Returns a full absolute URL for uploaded documents, images, and attachments.
 * If the path is already absolute, it is returned untouched.
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};
