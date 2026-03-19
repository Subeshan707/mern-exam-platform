// ── All API endpoint constants ──

export const AUTH = {
  ADMIN_REGISTER: '/auth/admin/register',
  STUDENT_REGISTER:'/auth/student/register',
  ADMIN_LOGIN:    '/auth/admin/login',
  STUDENT_LOGIN:  '/auth/student/login',
  REFRESH:        '/auth/refresh',
  LOGOUT:         '/auth/logout',
  CHANGE_PASSWORD:'/auth/change-password',
  FORGOT_PASSWORD:'/auth/forgot-password',
};

export const DASHBOARD = {
  ADMIN:            '/dashboard/admin',
  STUDENT:          '/dashboard/student',
  STUDENT_EXAM_STATS: '/dashboard/student/exam-stats',
};

export const GROUPS = {
  LIST:       '/groups',
  STATS:      '/groups/stats',
  DETAIL:     (id) => `/groups/${id}`,
  CREATE:     '/groups',
  UPDATE:     (id) => `/groups/${id}`,
  DELETE:     (id) => `/groups/${id}`,
  DEACTIVATE: (id) => `/groups/${id}/deactivate`,
};

export const STUDENTS = {
  LIST:          '/students',
  DETAIL:        (id) => `/students/${id}`,
  CREATE:        '/students',
  BULK_CREATE:   '/students/bulk',
  UPDATE:        (id) => `/students/${id}`,
  DELETE:        (id) => `/students/${id}`,
  TOGGLE_STATUS: (id) => `/students/${id}/toggle-status`,
  RESET_PASSWORD:(id) => `/students/${id}/reset-password`,
  EXAM_HISTORY:  (id) => `/students/${id}/exam-history`,
};

export const EXAMS = {
  LIST:            '/exams',
  DETAIL:          (id) => `/exams/${id}`,
  CREATE:          '/exams',
  UPDATE:          (id) => `/exams/${id}`,
  DELETE:          (id) => `/exams/${id}`,
  UPLOAD_QUESTIONS:'/exams/upload-questions',
  ASSIGN:          '/exams/assign',
  RESULTS:         (id) => `/exams/${id}/results`,
  ASSIGNMENTS:     (id) => `/exams/${id}/assignments`,
  DOWNLOAD_REPORT: (id) => `/exams/${id}/download-report`,
  STUDENT_ONGOING: '/exams/student/ongoing',
  START:           (id) => `/exams/${id}/start`,
  SAVE_ANSWER:     (attemptId) => `/exams/${attemptId}/save-answer`,
  SUBMIT:          (attemptId) => `/exams/${attemptId}/submit`,
  AUTO_SUBMIT:     (attemptId) => `/exams/${attemptId}/auto-submit`,
  VIOLATION:       (attemptId) => `/exams/${attemptId}/violation`,
};

export const RESULTS = {
  LIST:       '/results',
  MY_RESULTS: '/results/my-results',
  DETAIL:     (id) => `/results/${id}`,
  ANALYTICS:  (examId) => `/results/analytics/${examId}`,
  PUBLISH:    (examId) => `/results/publish/${examId}`,
  UNPUBLISH:  (examId) => `/results/unpublish/${examId}`,
  UPDATE:     (id) => `/results/${id}`,
};

export const REPORTS = {
  ANALYTICS:   '/reports/analytics',
  STUDENTS:    '/reports/students',
  EXAMS:       '/reports/exams',
  RESULTS:     '/reports/results',
  GROUP:       (groupId) => `/reports/groups/${groupId}`,
  PERFORMANCE: '/reports/performance',
};
