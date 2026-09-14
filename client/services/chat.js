import { fetcher } from './api';

export const chatService = {
  conversations: () => fetcher('/chat/conversations'),
  messages: (chatId) => fetcher(`/chat/messages/${chatId}`),
  sendMessage: (payload) => fetcher('/chat/messages', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    ...(payload instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } })
  })
};
