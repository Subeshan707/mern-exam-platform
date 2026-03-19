module.exports = {
  ROLES: {
    ADMIN: 'admin',
    STUDENT: 'student',
    SUPER_ADMIN: 'superadmin'
  },
  
  EXAM_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  ATTEMPT_STATUS: {
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    AUTO_SUBMITTED: 'auto-submitted',
    ABANDONED: 'abandoned'
  },
  
  VIOLATION_TYPES: {
    FULLSCREEN_EXIT: 'fullscreen-exit',
    TAB_SWITCH: 'tab-switch',
    BROWSER_MINIMIZE: 'browser-minimize',
    NAVIGATION_AWAY: 'navigation-away'
  },
  
  RESULT_STATUS: {
    PASS: 'pass',
    FAIL: 'fail',
    PENDING: 'pending'
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  JWT: {
    EXPIRES_IN: '24h',
    REFRESH_EXPIRES_IN: '7d'
  },
  
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100
  }
};