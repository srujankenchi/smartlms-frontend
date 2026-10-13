import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import courseApi from '../../api/courseApi';
import assignmentApi from '../../api/assignmentApi';
import { getFileUrl } from '../../api/config';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();

  // Navigation tab: 'assignments' | 'create'
  const [activeTab, setActiveTab] = useState('assignments');

  // Courses for dropdown
  const [courses, setCourses] = useState([]);

  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // New assignment form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Viewing submissions for an assignment
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading modal state
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await courseApi.getAllCourses();
      const list = res.data.data || [];
      setCourses(list);
      if (list.length > 0 && !courseId) {
        setCourseId(list[0].id);
      }
    } catch {
      toast.error('Failed to load courses');
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await assignmentApi.getAllAssignments();
      setAssignments(res.data.data || []);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (creating) return;

    setFormError('');

    if (!title.trim()) {
      const err = 'Assignment title is required';
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!courseId) {
      const err = 'Please select an associated course';
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!dueDate) {
      const err = 'Due date (deadline) is required';
      setFormError(err);
      toast.error(err);
      return;
    }

    setCreating(true);
    try {
      // Ensure due date has end-of-day time if date-only is provided
      const formattedDate = dueDate.includes('T') ? dueDate : `${dueDate}T23:59:59`;

      await assignmentApi.createAssignment({
        title: title.trim(),
        description: description.trim(),
        dueDate: formattedDate,
        courseId: Number(courseId),
      });

      toast.success('Assignment created successfully!');
      setTitle('');
      setDescription('');
      setDueDate('');
      setFormError('');
      setActiveTab('assignments');
      fetchAssignments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create assignment';
      setFormError(msg);
      toast.error(msg);
      // NOTE: Form inputs are preserved so the teacher can easily correct them
    } finally {
      setCreating(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const res = await assignmentApi.getSubmissions(assignment.id);
      setSubmissions(res.data.data || []);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleOpenGradeModal = (sub) => {
    setGradingSub(sub);
    setGradeMarks(
      sub.marksObtained !== null && sub.marksObtained !== undefined ? String(sub.marksObtained) : ''
    );
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSub) return;

    const parsedMarks = parseFloat(gradeMarks);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
      toast.error('Marks awarded must be between 0 and 100');
      return;
    }

    setSubmittingGrade(true);
    try {
      const res = await assignmentApi.gradeSubmission(gradingSub.id, {
        marks: parsedMarks,
        feedback: gradeFeedback.trim(),
      });

      toast.success('Grade and feedback saved successfully!');
      // Update submission in state immediately
      setSubmissions((prev) =>
        prev.map((s) => (s.id === gradingSub.id ? { ...s, ...res.data.data } : s))
      );
      setGradingSub(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to grade submission';
      toast.error(msg);
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <Header
        icon="👨‍🏫"
        portalBadge="Faculty Portal"
        badgeVariant="indigo"
        tabs={[
          {
            id: 'assignments',
            label: `All Assignments (${assignments.length})`,
            active: activeTab === 'assignments' && !selectedAssignment,
            onClick: () => {
              setActiveTab('assignments');
              setSelectedAssignment(null);
            },
          },
          {
            id: 'create',
            label: '+ Create Assignment',
            active: activeTab === 'create',
            onClick: () => {
              setActiveTab('create');
              setSelectedAssignment(null);
            },
          },
        ]}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* VIEW 1: View Student Submissions for an Assignment */}
        {selectedAssignment ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm transition"
              >
                ← Back to Assignments
              </button>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                {selectedAssignment.courseTitle || 'General Course'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedAssignment.title}</h2>
                  <p className="text-slate-600 text-sm mt-1">{selectedAssignment.description || 'No detailed instructions provided.'}</p>
                </div>
                {selectedAssignment.dueDate && (
                  <div className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
                    📅 Deadline: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Student Submissions ({submissions.length})
                </h3>
              </div>

              {loadingSubmissions ? (
                <div className="py-20 text-center text-slate-500">Loading student submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-50">
                  <p className="font-medium text-slate-600">No students have submitted this assignment yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Student submissions will appear here once uploaded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Student</th>
                        <th className="px-5 py-3.5">Submission Date</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Marks Awarded</th>
                        <th className="px-5 py-3.5">Teacher Feedback</th>
                        <th className="px-5 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">{sub.studentName}</div>
                            <div className="text-xs text-slate-500">{sub.studentEmail}</div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                sub.status === 'GRADED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sub.status === 'GRADED' ? '✓ Graded' : 'Pending Evaluation'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            {sub.marksObtained !== null && sub.marksObtained !== undefined
                              ? `${sub.marksObtained} / 100`
                              : '—'}
                          </td>
                          <td className="px-5 py-4 text-xs italic text-slate-600 max-w-xs truncate">
                            {sub.feedback || '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {sub.fileUrl ? (
                              <a
                                href={getFileUrl(sub.fileUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition border border-slate-200 shadow-sm"
                              >
                                📄 View File
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No file</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'create' ? (
          /* VIEW 2: Create Assignment Form */
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Assignment</h2>
              <p className="text-slate-600 text-sm mt-1">
                Post a new coursework assignment with a deadline for student submissions.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              {formError && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAssignment} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Assignment Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. C Programming Lab 1 — Pointers & Arrays"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Associated Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `[${c.code}] ` : ''}{c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Due Date (Deadline) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">Students will have until the end of this date to submit their documents.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Description & Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details on the assignment requirements and submission criteria..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('assignments')}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {creating ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Creating Assignment...</span>
                      </>
                    ) : (
                      'Create Assignment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* VIEW 3: List of All Assignments */
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assignment Management</h2>
                <p className="text-slate-600 mt-1 text-sm">
                  View your active assignments and review student submissions.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                + New Assignment
              </button>
            </div>

            {loadingAssignments ? (
              <div className="py-24 text-center text-slate-500">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-600 font-medium">No assignments created yet.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  Create First Assignment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                          {assignment.courseTitle || 'General'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {assignment.submissionCount} Submissions
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{assignment.title}</h3>
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                        {assignment.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">
                          {assignment.dueDate
                            ? `📅 Due: ${new Date(assignment.dueDate).toLocaleDateString()}`
                            : 'No deadline'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Points: {assignment.maxMarks || 100}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewSubmissions(assignment)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition"
                      >
                        Submissions ({assignment.submissionCount})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grading Modal Dialog */}
        {gradingSub && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">
                    Grade Student Submission
                  </h3>
                  <button
                    onClick={() => setGradingSub(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                  <div>
                    <span className="font-semibold text-slate-600">Student: </span>
                    <span className="font-bold text-slate-900">{gradingSub.studentName}</span>
                    <span className="text-slate-500"> ({gradingSub.studentEmail})</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Assignment: </span>
                    <span className="font-medium text-slate-800">{selectedAssignment ? selectedAssignment.title : 'Assignment'}</span>
                  </div>
                  {gradingSub.fileUrl && (
                    <div className="pt-1">
                      <span className="font-semibold text-slate-600">Submitted Document: </span>
                      <a
                        href={getFileUrl(gradingSub.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                      >
                        📄 {gradingSub.originalFileName || gradingSub.fileName || 'View Submitted File'}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveGrade} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Marks Awarded <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Maximum: 100
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={gradeMarks}
                    onChange={(e) => setGradeMarks(e.target.value)}
                    placeholder="Enter marks (0 - 100), e.g. 94"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Teacher Feedback & Remarks
                  </label>
                  <textarea
                    rows={4}
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    placeholder="Provide constructive feedback for the student..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGradingSub(null)}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrade}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {submittingGrade ? 'Saving Grade...' : 'Save Grade'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
