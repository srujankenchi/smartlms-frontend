import axiosInstance from './axiosInstance';

const assignmentApi = {
  /**
   * GET /api/assignments
   */
  getAllAssignments: () => axiosInstance.get('/assignments'),

  /**
   * GET /api/assignments/:id
   */
  getAssignmentById: (id) => axiosInstance.get(`/assignments/${id}`),

  /**
   * GET /api/assignments/course/:courseId
   */
  getAssignmentsByCourse: (courseId) => axiosInstance.get(`/assignments/course/${courseId}`),

  /**
   * POST /api/assignments (Teacher)
   */
  createAssignment: (data) => axiosInstance.post('/assignments', data),

  /**
   * POST /api/assignments/:id/submit (Student upload)
   */
  submitAssignment: (assignmentId, formData) =>
    axiosInstance.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  /**
   * GET /api/assignments/:id/submissions (Teacher view)
   */
  getSubmissions: (assignmentId) => axiosInstance.get(`/assignments/${assignmentId}/submissions`),

  /**
   * GET /api/assignments/:id/my-submission (Student view)
   */
  getMySubmission: (assignmentId) => axiosInstance.get(`/assignments/${assignmentId}/my-submission`),

  /**
   * POST /api/assignments/submissions/:submissionId/grade (Teacher grade)
   */
  gradeSubmission: (submissionId, data) =>
    axiosInstance.post(`/assignments/submissions/${submissionId}/grade`, data),
};

export default assignmentApi;
