import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 font-extrabold text-3xl mb-4">
          🚫
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">403 Forbidden</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          You do not have the required permissions or role privileges to view this page.
        </p>
        <Link
          to="/"
          className="inline-block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
