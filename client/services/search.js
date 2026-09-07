import { fetcher } from './api';

export const searchService = {
  globalSearch: (query, limit = 20) => fetcher(`/search/global?q=${encodeURIComponent(query)}&limit=${limit}`),
  searchUsers: (query, limit = 10) => fetcher(`/search/users?q=${encodeURIComponent(query)}&limit=${limit}`),
  searchPosts: (query, limit = 10) => fetcher(`/search/posts?q=${encodeURIComponent(query)}&limit=${limit}`),
  getHistory: () => fetcher('/search/history'),
  clearHistory: () => fetcher('/search/history', { method: 'DELETE' })
};
