import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { getCorsOptions } from '../config';

export type RealtimeEvent =
  | 'product:created'
  | 'product:updated'
  | 'product:deleted'
  | 'products:bulk-updated'
  | 'category:created'
  | 'category:updated'
  | 'category:deleted'
  | 'categories:reordered'
  | 'board:updated';

export type RealtimePayload = {
  event: RealtimeEvent;
  data?: unknown;
  timestamp: string;
};

let io: Server | null = null;
export const SOCKET_IO_PATH = '/api/socket.io';

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: SOCKET_IO_PATH,
    cors: {
      ...getCorsOptions(),
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  io.on('connection', (socket: Socket) => {
    socket.join('board');
    socket.join('admin');

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitRealtime(event: RealtimeEvent, data?: unknown): void {
  if (!io) return;

  const payload: RealtimePayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  io.to('board').emit('realtime', payload);
  io.to('admin').emit('realtime', payload);
}

export function emitBoardUpdated(): void {
  emitRealtime('board:updated');
}
