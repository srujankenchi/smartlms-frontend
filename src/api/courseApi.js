import axiosInstance from './axiosInstance';

const courseApi = {
  /**
   * GET /api/courses
   */
  getAllCourses: () => axiosInstance.get('/courses'),

  /**
   * GET /api/courses/:id
   */
  getCourseById: (id) => axiosInstance.get(`/courses/${id}`),

  /**
   * GET /api/courses/:courseId/lessons
   */
  getCourseLessons: (courseId) => axiosInstance.get(`/courses/${courseId}/lessons`),
};

export default courseApi;
