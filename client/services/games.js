import { fetcher } from './api';

export const gameService = {
  list: () => fetcher('/games'),
  create: (payload) => fetcher('/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  history: () => fetcher('/games/history'),
  createSession: (payload) => fetcher('/games/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
};
