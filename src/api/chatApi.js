import axiosInstance from './axiosInstance';

/**
 * SmartLMS Class Connect Chat API Client.
 */
export const chatApi = {
  // Retrieve chronological message history
  getMessages: () => axiosInstance.get('/chat/messages'),

  // Send a JSON text message (optional replyToId, optional attachmentIds)
  sendMessage: (payload) => axiosInstance.post('/chat/messages', payload),

  // Send a message with direct file upload via multipart/form-data
  sendMessageMultipart: (formData, onProgress) =>
    axiosInstance.post('/chat/messages/multipart', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),

  // Upload an attachment separately
  uploadAttachment: (formData, onProgress) =>
    axiosInstance.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),

  // Toggle emoji reaction
  toggleReaction: (messageId, emoji) =>
    axiosInstance.post(`/chat/messages/${messageId}/react`, { emoji }),

  // Toggle pin status (Teacher / Admin)
  togglePin: (messageId) => axiosInstance.post(`/chat/messages/${messageId}/pin`),

  // Delete message
  deleteMessage: (messageId) => axiosInstance.delete(`/chat/messages/${messageId}`),

  // Unread message count and preview
  getUnreadCount: () => axiosInstance.get('/chat/unread'),

  // Mark messages as read
  markAsRead: (messageId) =>
    axiosInstance.post(messageId ? `/chat/mark-read?messageId=${messageId}` : '/chat/mark-read'),

  // Pinned announcements
  getPinnedMessages: () => axiosInstance.get('/chat/pinned'),

  // Group metadata and members
  getGroupInfo: () => axiosInstance.get('/chat/group-info'),

  // Search messages
  searchMessages: (query) => axiosInstance.get(`/chat/search?q=${encodeURIComponent(query)}`),
};

export default chatApi;
