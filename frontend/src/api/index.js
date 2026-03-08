const BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
    };
};

const handleResponse = async (res) => {
    if (res.status === 401) {
        console.warn('Unauthorized request detected. Clearing session...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Only redirect if not already on the login page to avoid loops
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
        }
        throw new Error('Your session has expired. Please log in again.');
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    const ct = res.headers.get('content-type');
    if (ct && ct.includes('application/json')) return res.json();
    return res.text();
};

export const api = {
    get: (path) => fetch(`${BASE_URL}${path}`, { headers: getHeaders() }).then(handleResponse),
    post: (path, body) => fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    }).then(handleResponse),
    put: (path, body) => fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: getHeaders(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    }).then(handleResponse),
    del: (path) => fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

// Auth
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
};

// Users
export const usersApi = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getProjects: (id) => api.get(`/users/${id}/projects`),
    getStartups: (id) => api.get(`/users/${id}/startups`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id, reason = '') => api.del(`/users/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`),
};

// Startups
export const startupsApi = {
    getAll: () => api.get('/startups'),
    getById: (id) => api.get(`/startups/${id}`),
    create: (data) => api.post('/startups', data),
    update: (id, data) => api.put(`/startups/${id}`, data),
    delete: (id) => api.del(`/startups/${id}`),
    getFundings: (id) => api.get(`/startups/${id}/fundings`),
    assignMentor: (id, mentorId) => api.put(`/startups/${id}/mentor/${mentorId}`),
};

// Funding Applications
export const fundingAppApi = {
    getAll: () => api.get('/funding-applications'),
    apply: (data) => api.post('/funding-applications', data),
    getByInvestor: (id) => api.get(`/funding-applications/investor/${id}`),
    getByStartup: (id) => api.get(`/funding-applications/startup/${id}`),
    updateStatus: (id, status) => fetch(`${BASE_URL}/funding-applications/${id}/status?status=${status}`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
};

// Notifications
export const notificationsApi = {
    getByUser: (userId) => api.get(`/notifications/user/${userId}`),
    getUnread: (userId) => api.get(`/notifications/user/${userId}/unread`),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: (userId) => api.put(`/notifications/user/${userId}/read-all`),
    broadcastAnnouncement: (message) => fetch(`${BASE_URL}/notifications/broadcast?message=${encodeURIComponent(message)}`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
    broadcastToRole: (message, role) => fetch(`${BASE_URL}/notifications/broadcast-by-role?message=${encodeURIComponent(message)}&role=${role}`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
};


// Messages
export const messagesApi = {
    send: (data) => api.post('/messages', data),
    getConversation: (otherUserId) => api.get(`/messages/conversation/${otherUserId}`),
    getRecentConversations: () => api.get('/messages/recent-conversations'),
    markRead: (id) => api.put(`/messages/${id}/read`),
};

// Mentors
export const mentorsApi = {
    getAll: () => api.get('/mentors'),
    getById: (id) => api.get(`/mentors/${id}`),
    getByUserId: (userId) => api.get(`/mentors/user/${userId}`),
    create: (data) => api.post('/mentors', data),
    update: (id, data) => api.put(`/mentors/${id}`, data),
    delete: (id) => api.del(`/mentors/${id}`),
    approve: (id, status) => fetch(`${BASE_URL}/mentors/${id}/approve?status=${status}`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
    getPending: () => api.get('/mentors/pending'),
};

// Mentorship Requests (the new flow)
export const mentorshipRequestsApi = {
    create: (startupId, mentorId, message = '') => api.post(`/mentorship-requests/startup/${startupId}/mentor/${mentorId}?message=${encodeURIComponent(message)}`),
    getForMentor: (userId) => api.get(`/mentorship-requests/mentor/${userId}`),
    getForStartup: (userId) => api.get(`/mentorship-requests/startup/${userId}`),
    updateStatus: (requestId, status) => fetch(`${BASE_URL}/mentorship-requests/${requestId}/status?status=${status}`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
};

// Research Projects
export const projectsApi = {
    getAll: () => api.get('/projects'),
    getByResearcher: (userId) => api.get(`/projects/researcher/${userId}`),
    getById: (id) => api.get(`/projects/${id}`),

    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.del(`/projects/${id}`),
    getPatents: (id) => api.get(`/projects/${id}/patents`),
};

// Patents
export const patentsApi = {
    create: (data) => api.post('/patents', data),
    update: (id, data) => api.put(`/patents/${id}`, data),
    delete: (id) => api.del(`/patents/${id}`),
};

// Investor Profiles

export const investorProfilesApi = {
    getByUserId: (userId) => api.get(`/investor-profiles/user/${userId}`),
    updateByUserId: (userId, data) => api.put(`/investor-profiles/user/${userId}`, data),
};

// Documents (Vault)
export const documentsApi = {
    upload: (formData) => fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token').trim()}` } : {}),
        },
        body: formData
    }).then(handleResponse),
    getByStartup: (startupId) => api.get(`/documents/startup/${startupId}`),
    delete: (documentId) => api.del(`/documents/${documentId}`),
    download: (documentId, userId) => {
        const token = localStorage.getItem('token');
        const url = `${BASE_URL}/documents/download/${documentId}?userId=${userId}`;
        return fetch(url, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
            }
        }).then(res => {
            if (!res.ok) throw new Error('Download failed');
            return res.blob();
        });
    },
    grantPermission: (data) => api.post('/documents/permissions/grant', data),
    revokePermission: (documentId, investorId) => api.del(`/documents/permissions/revoke?documentId=${documentId}&investorId=${investorId}`),
    getSharedForInvestor: (investorId) => api.get(`/documents/shared/${investorId}`),
};

// Feedback & Reputation
export const feedbackApi = {
    leave: (data) => api.post('/feedback', data),
    update: (id, data) => api.put(`/feedback/${id}`, data),
    getForTarget: (targetId, type) => api.get(`/feedback/target/${targetId}?type=${type}`),
    delete: (id) => api.del(`/feedback/${id}`),
};

// Forums
export const forumApi = {
    createPost: (data) => api.post('/forum/posts', data),
    getPosts: (category) => api.get(`/forum/posts${category ? `?category=${encodeURIComponent(category)}` : ''}`),
    getPost: (id) => api.get(`/forum/posts/${id}`),
    addComment: (data) => api.post('/forum/comments', data),
    getComments: (postId) => api.get(`/forum/posts/${postId}/comments`),
};
