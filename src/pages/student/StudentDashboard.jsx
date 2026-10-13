import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import courseApi from '../../api/courseApi';
import assignmentApi from '../../api/assignmentApi';
import { getFileUrl } from '../../api/config';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  // Navigation tabs: 'courses' | 'assignments'
  const [activeTab, setActiveTab] = useState('courses');

  // Courses state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Active watching course & lesson
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mySubmissions, setMySubmissions] = useState({});

  // 1. Fetch 6 courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await courseApi.getAllCourses();
      setCourses(res.data.data || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  // 2. Fetch assignments when tab switches
  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
    }
  }, [activeTab]);

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const res = await assignmentApi.getAllAssignments();
      const list = res.data.data || [];
      setAssignments(list);

      // Fetch student's submission status for each assignment
      const subs = {};
      await Promise.all(
        list.map(async (a) => {
          try {
            const subRes = await assignmentApi.getMySubmission(a.id);
            if (subRes.data.data) {
              subs[a.id] = subRes.data.data;
            }
          } catch {
            // Not submitted yet
          }
        })
      );
      setMySubmissions(subs);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // 3. Open a course to view lessons and video
  const handleOpenCourse = async (course) => {
    setSelectedCourse(course);
    setLessonsLoading(true);
    try {
      const res = await courseApi.getCourseLessons(course.id);
      const lessons = res.data.data || [];
      setCourseLessons(lessons);
      if (lessons.length > 0) {
        setActiveLesson(lessons[0]);
      } else {
        setActiveLesson(null);
      }
    } catch {
      toast.error('Failed to load lessons for ' + course.title);
    } finally {
      setLessonsLoading(false);
    }
  };

  // 4. Handle assignment submission
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', submissionFile);
    if (submissionRemarks) {
      formData.append('remarks', submissionRemarks);
    }

    try {
      const res = await assignmentApi.submitAssignment(selectedAssignment.id, formData);
      toast.success('Assignment submitted successfully!');
      setMySubmissions((prev) => ({
        ...prev,
        [selectedAssignment.id]: res.data.data,
      }));
      setSelectedAssignment(null);
      setSubmissionFile(null);
      setSubmissionRemarks('');
      fetchAssignments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <Header
        icon="📚"
        portalBadge="Student Portal"
        badgeVariant="blue"
        tabs={[
          {
            id: 'courses',
            label: `Courses (${courses.length})`,
            active: activeTab === 'courses' && !selectedCourse,
            onClick: () => {
              setActiveTab('courses');
              setSelectedCourse(null);
            },
          },
          {
            id: 'assignments',
            label: 'Assignments',
            active: activeTab === 'assignments',
            onClick: () => {
              setActiveTab('assignments');
              setSelectedCourse(null);
            },
          },
        ]}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* VIEW 1: Video Lesson Player (when a course is selected) */}
        {selectedCourse ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm transition"
              >
                ← Back to All Courses
              </button>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                {selectedCourse.category || 'General'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCourse.title}</h2>
              <p className="text-slate-600 text-sm mb-6">{selectedCourse.description}</p>

              {lessonsLoading ? (
                <div className="py-20 text-center text-slate-500">Loading course video lessons...</div>
              ) : courseLessons.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl">
                  No video lessons available for this course yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Player */}
                  <div className="lg:col-span-2">
                    {activeLesson?.videoUrl ? (
                      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-md">
                        <iframe
                          className="w-full h-full"
                          src={activeLesson.videoUrl}
                          title={activeLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                        No video link provided
                      </div>
                    )}

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-slate-900">{activeLesson?.title}</h3>
                      {activeLesson?.description && (
                        <p className="text-slate-600 text-sm mt-1">{activeLesson.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Lessons List */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-fit">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Course Lessons ({courseLessons.length})
                    </h4>
                    <div className="space-y-2">
                      {courseLessons.map((lesson, idx) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full text-left p-3 rounded-lg text-sm font-medium transition flex items-center gap-3 ${
                            activeLesson?.id === lesson.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              activeLesson?.id === lesson.id
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate flex-1">{lesson.title}</span>
                          <span className="text-xs">▶</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'courses' ? (
          /* VIEW 2: Six Learning Courses Grid */
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Available Courses</h2>
              <p className="text-slate-600 mt-1 text-sm">
                Explore the six foundational college curriculum courses and watch video lessons.
              </p>
            </div>

            {coursesLoading ? (
              <div className="py-24 text-center text-slate-500">Loading courses from server...</div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-600 font-medium">No courses found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col h-full hover:border-slate-300"
                  >
                    {/* Consistent Course Image Dimension */}
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="h-48 w-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-48 bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-bold shrink-0">
                        {course.title.charAt(0)}
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                              {course.category || 'Programming'}
                            </span>
                            {course.code && (
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                {course.code}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {course.lessonCount || 1} Lesson
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">{course.title}</h3>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                          {course.description || 'Comprehensive programming video course.'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenCourse(course)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-auto"
                      >
                        <span>▶</span> Watch Lessons
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 3: Assignments & Document Submission */
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coursework Assignments</h2>
              <p className="text-slate-600 mt-1 text-sm">
                View coursework deadlines and submit PDF or document solutions for teacher review.
              </p>
            </div>

            {assignmentsLoading ? (
              <div className="py-24 text-center text-slate-500">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-600 font-medium">No assignments currently posted.</p>
                <p className="text-xs text-slate-400 mt-1">Check back later when teachers assign coursework.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {assignments.map((assignment) => {
                  const submission = mySubmissions[assignment.id];
                  const isSubmitted = !!submission;

                  return (
                    <div
                      key={assignment.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                              {assignment.courseTitle || 'General Course'}
                            </span>
                            {isSubmitted ? (
                              submission.status === 'GRADED' ? (
                                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                                  ✓ Graded ({submission.marksObtained !== null && submission.marksObtained !== undefined ? submission.marksObtained : '—'} / 100)
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                                  ✓ Submitted (Pending Evaluation)
                                </span>
                              )
                            ) : (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full">
                                Pending Submission
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-slate-900 mb-1">{assignment.title}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed mb-3">
                            {assignment.description || 'No additional instructions.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            {assignment.dueDate && (
                              <div className="flex items-center gap-1 font-medium">
                                <span>📅</span> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            {isSubmitted && submission.submittedAt && (
                              <div className="flex items-center gap-1 text-slate-400">
                                Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Teacher Feedback Card */}
                          {isSubmitted && submission.feedback && (
                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                              <div className="font-bold text-emerald-900 flex items-center gap-1 mb-1">
                                <span>👨‍🏫</span> Faculty Feedback & Evaluation:
                              </div>
                              <p className="text-slate-800 italic">{submission.feedback}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2 shrink-0">
                          {isSubmitted && submission.fileUrl && (
                            <a
                              href={getFileUrl(submission.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-center flex items-center justify-center gap-1"
                            >
                              📄 View Submitted Document
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition shadow-sm ${
                              isSubmitted
                                ? 'bg-slate-900 text-white hover:bg-black'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isSubmitted ? 'Resubmit Document' : 'Submit Solution'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submission Modal */}
            {selectedAssignment && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-slate-900">
                      Submit Coursework Solution
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Assignment: <span className="font-semibold text-slate-800">{selectedAssignment.title}</span>
                    </p>
                  </div>

                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Select Document (PDF, DOC, DOCX, TXT) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="file"
                        required
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setSubmissionFile(e.target.files[0])}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Submission Notes / Remarks (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={submissionRemarks}
                        onChange={(e) => setSubmissionRemarks(e.target.value)}
                        placeholder="e.g. Attached solution for all exercises with test runs."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedAssignment(null)}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 shadow-sm"
                      >
                        {submitting ? 'Uploading...' : 'Upload & Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
