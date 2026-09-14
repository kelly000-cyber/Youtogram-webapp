import { fetcher } from './api';

export const notificationService = {
  list: (limit = 30, skip = 0) => fetcher(`/notifications?limit=${limit}&skip=${skip}`),
  unreadCount: () => fetcher('/notifications/unread-count'),
  markAllRead: () => fetcher('/notifications/read-all', { method: 'PATCH' }),
  markRead: (id) => fetcher(`/notifications/${id}/read`, { method: 'PATCH' })
};
