export const endpoints = {
  payments: {
    createIntent: "/api/payments/create-intent",
    webhook: "/api/payments/webhook"
  },
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    adminLogin: "/api/auth/admin/login"
  },
  diaspora: {
    project: (id: string) => `/api/projects/${id}`,
    documents: (id: string) => `/api/projects/${id}/documents`,
    payments: (id: string) => `/api/projects/${id}/payments`,
    paymentConfirm: (id: string, paymentId: string) => `/api/projects/${id}/payments/${paymentId}/confirm`,
    messages: (projectId: string) => `/api/messages/${projectId}`,
    colis: "/api/colis"
  },
  agence: {
    projects: "/api/agence/projects",
    updateProgress: (id: string) => `/api/agence/projects/${id}/progress`,
    colis: "/api/agence/colis",
    updateColisStatus: (id: string) => `/api/agence/colis/${id}/status`,
    paymentRequests: "/api/agence/payments/requests",
    createPaymentRequest: "/api/agence/payments/request",
    conversations: "/api/agence/messages/projects",
    messages: (conversationId: string) => `/api/agence/messages/${conversationId}`
  },
  admin: {
    dashboard: "/api/admin/dashboard",
    projects: "/api/admin/projects",
    updateProjectStatus: (id: string) => `/api/admin/projects/${id}/status`,
    finances: "/api/admin/finances",
    users: "/api/admin/users",
    updateUserStatus: (id: string) => `/api/admin/users/${id}/status`,
    notifications: "/api/admin/notifications",
    markNotificationRead: (id: string) => `/api/admin/notifications/${id}/read`,
    markAllNotificationsRead: "/api/admin/notifications/read-all",
    exports: "/api/admin/exports",
    runExport: (id: string) => `/api/admin/exports/${id}`
  }
} as const;
