import { fetcher } from './api';

export const chatService = {
  conversations: () => fetcher('/chat/conversations'),
  messages: (chatId) => fetcher(`/chat/messages/${chatId}`),
  sendMessage: (payload) => fetcher('/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
};
