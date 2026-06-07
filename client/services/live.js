import { fetcher } from './api';

export const liveService = {
  listSessions: () => fetcher('/live/sessions'),
  createSession: (payload) => fetcher('/live/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  joinSession: (sessionId) => fetcher(`/live/session/${sessionId}/join`, {
    method: 'POST'
  })
};
