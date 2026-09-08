import { fetcher } from './api';

export const postService = {
  feed: (query = '') => fetcher(`/posts${query ? `?${query}` : ''}`),
  create: (payload) => fetcher('/posts', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    ...(payload instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } })
  }),
  toggleLike: (postId) => fetcher(`/posts/${postId}/like`, {
    method: 'PUT'
  }),
  addComment: (postId, payload) => fetcher(`/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  trackInterest: (postId, action) => fetcher(`/posts/${postId}/interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  }),
  stories: () => fetcher('/posts/stories')
};
