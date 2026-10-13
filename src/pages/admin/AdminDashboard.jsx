import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <Header
        icon="⚡"
        portalBadge="Administrator"
        badgeVariant="purple"
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Administration</h2>
          <p className="text-slate-600 mt-1 text-sm">
            Platform control panel. As an administrator, you have full privileges across coursework, assignments, and submissions.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 font-bold text-2xl flex items-center justify-center shrink-0">
              🛡️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Administrator Account Verified
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Logged in as <strong>{user?.email}</strong>. This account has <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-purple-800 font-semibold">ROLE_ADMIN</code> authority, which permits access to all student courses, teacher assignment portals, and grading oversight.
              </p>
            </div>
          </div>
        </div>

        {/* Portal Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Courses Portal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-4">
                📚
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Student Course Catalog</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Inspect the six active core curriculum courses (C, Java, Python, HTML/CSS, DBMS, React), video lectures, and student-facing assignment lists.
              </p>
            </div>
            <Link
              to="/student/dashboard"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm text-center"
            >
              View Student Portal →
            </Link>
          </div>

          {/* Card 2: Faculty Portal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xl mb-4">
                👨‍🏫
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Teacher Assignment & Grading Portal</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Create new coursework assignments, inspect student file submissions, download submitted work, and manage student grades and feedback.
              </p>
            </div>
            <Link
              to="/teacher/dashboard"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm text-center"
            >
              View Teacher Portal →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
