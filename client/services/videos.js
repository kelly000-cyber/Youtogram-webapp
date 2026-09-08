import { fetcher } from './api';

export const videoService = {
  list: (query = '') => fetcher(`/videos${query ? `?${query}` : ''}`),
  upload: (payload) => fetcher('/videos', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    ...(payload instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } })
  }),
  like: (videoId) => fetcher(`/videos/${videoId}/like`, {
    method: 'PUT'
  }),
  comment: (videoId, payload) => fetcher(`/videos/${videoId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
};
