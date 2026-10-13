import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/config';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiBookOpen, FiUserCheck } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to the appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ROLE_ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'ROLE_TEACHER':
          navigate('/teacher/dashboard', { replace: true });
          break;
        default:
          navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFieldErrors({});
    setErrorMessage('');
    toast('Filled demo credentials', { icon: '⚡' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back, ' + (loggedInUser.name || 'User') + '!');

      // Route strictly based on the server-authenticated role
      switch (loggedInUser.role) {
        case 'ROLE_ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'ROLE_TEACHER':
          navigate('/teacher/dashboard');
          break;
        default:
          navigate('/student/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        const networkMsg = `Cannot connect to the SmartLMS backend server (${API_BASE_URL}). Please verify your backend is running and reachable.`;
        setErrorMessage(networkMsg);
        toast.error('Connection failed: Server unreachable');
      } else if (err.response.status === 401 || err.response.status === 400) {
        const msg = err.response.data?.message || 'Invalid email or password.';
        setErrorMessage(msg);
        toast.error(msg);
      } else if (err.response.status === 403) {
        const msg = 'Your account has been disabled or suspended. Please contact support.';
        setErrorMessage(msg);
        toast.error(msg);
      } else {
        const msg = err.response.data?.message || 'An unexpected error occurred during sign in.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen subtle-mesh flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="glass-card rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/60 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              SmartLMS Platform
            </div>
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <span className="text-3xl">🎓</span>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent tracking-tight">
                SmartLMS
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              Sign in to manage courses, assignments, and real-time class discussions
            </p>
          </div>

          {/* Quick Demo Fill Pills */}
          <div className="mb-6 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Quick Demo Logins
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student@smartlms.com', 'student123')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition shadow-xs"
              >
                <FiBookOpen className="text-blue-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('teacher@smartlms.com', 'teacher123')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 transition shadow-xs"
              >
                <FiUserCheck className="text-indigo-600" />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@smartlms.com', 'admin123')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 border border-slate-200 hover:border-violet-300 transition shadow-xs"
              >
                <FiShield className="text-violet-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50/90 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
              <span className="text-rose-600 font-bold shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiMail className="text-base" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-sm outline-none transition duration-150 ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200/90 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white/90'
                  }`}
                  placeholder="student@smartlms.com"
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 pl-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="text-base" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`w-full pl-10 pr-11 py-3 border rounded-2xl text-sm outline-none transition duration-150 ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200/90 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white/90'
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 pl-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="text-base" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                Create Student Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
