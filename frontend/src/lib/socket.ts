import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: getAccessToken(),
      },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: getAccessToken() };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type SocketEventHandler = (...args: unknown[]) => void;

export function onSocketEvent(event: string, handler: SocketEventHandler): () => void {
  const s = getSocket();
  s.on(event, handler);
  return () => {
    s.off(event, handler);
  };
}
