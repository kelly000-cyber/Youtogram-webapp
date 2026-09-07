import { fetcher } from './api';

export const postService = {
  feed: (query = '') => fetcher(`/posts${query ? `?${query}` : ''}`),
  create: (payload) => fetcher('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  toggleLike: (postId) => fetcher(`/posts/${postId}/like`, {
    method: 'PUT'
  }),
  addComment: (postId, payload) => fetcher(`/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  stories: () => fetcher('/posts/stories')
};
