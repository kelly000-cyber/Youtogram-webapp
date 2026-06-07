import { fetcher } from './api';

export const authService = {
  register: (payload) => fetcher('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  login: (payload) => fetcher('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  me: () => fetcher('/auth/me'),
  users: () => fetcher('/auth/users'),
  followUser: (userId) => fetcher(`/auth/follow/${userId}`, {
    method: 'POST'
  }),
  unfollowUser: (userId) => fetcher(`/auth/follow/${userId}`, {
    method: 'DELETE'
  }),
  sendFriendRequest: (userId) => fetcher(`/auth/friends/${userId}`, {
    method: 'POST'
  }),
  updateProfile: (payload) => fetcher('/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  purchaseVerification: () => fetcher('/auth/purchase-verification', {
    method: 'POST'
  }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('youtogram_token');
    }
    return Promise.resolve();
  }
};
