import axiosInstance from './axiosInstance';

/**
 * Auth API — calls the real backend endpoints.
 * Never uses mock data.
 */
const authApi = {
  /**
   * POST /api/auth/register
   * @param {{ name: string, email: string, password: string }} data
   */
  register: (data) => axiosInstance.post('/auth/register', data),

  /**
   * POST /api/auth/login
   * @param {{ email: string, password: string }} data
   */
  login: (data) => axiosInstance.post('/auth/login', data),

  /**
   * GET /api/auth/me
   * Requires a valid JWT in the Authorization header (set by axiosInstance).
   */
  getCurrentUser: () => axiosInstance.get('/auth/me'),
};

export default authApi;
