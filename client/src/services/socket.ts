import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to backend server:', socket?.id);
    });

    socket.on('connect_error', err => {
      console.warn('[Socket.IO Client] Connection error:', err.message);
    });
  }
  return socket;
};
