import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (url) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const client = io(url, { transports: ['websocket'] });
    setSocket(client);

    return () => {
      client.disconnect();
    };
  }, [url]);

  return socket;
};
