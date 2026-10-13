import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/config';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      errors.name = 'Full name is required (at least 2 characters).';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Public registration unconditionally creates a student account on backend
      await register(name.trim(), email.trim().toLowerCase(), password);
      toast.success('Registration successful! Welcome to SmartLMS.');
      navigate('/student/dashboard');
    } catch (err) {
      if (!err.response) {
        const networkMsg = `Cannot connect to the server (${API_BASE_URL}). Please verify your backend is running.`;
        setErrorMessage(networkMsg);
        toast.error('Connection failed');
      } else {
        const msg = err.response.data?.message || 'Registration failed. Please check your details.';
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
          {/* Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Student Registration
            </div>
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <span className="text-3xl">🎓</span>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent tracking-tight">
                Join SmartLMS
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              Create your student account to enroll in courses and track assignments
            </p>
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
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiUser className="text-base" />
                </div>
                <input
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-sm outline-none transition duration-150 ${
                    fieldErrors.name
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200/90 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white/90'
                  }`}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 pl-1">{fieldErrors.name}</p>
              )}
            </div>

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
                  placeholder="alex@example.com"
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 pl-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
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
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="text-base" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`w-full pl-10 pr-11 py-3 border rounded-2xl text-sm outline-none transition duration-150 ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200/90 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white/90'
                  }`}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 pl-1">{fieldErrors.confirmPassword}</p>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight className="text-base" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
