import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSocketMap: Map<string, Set<string>> = new Map();
  private socketUserMap: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from user-socket mapping
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      const sockets = this.userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSocketMap.delete(userId);
        }
      }
      this.socketUserMap.delete(client.id);
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    // Validate JWT from socket.auth.token instead of trusting client-supplied userId
    const token = client.handshake?.auth?.token;
    if (!token) {
      this.logger.warn(`Socket ${client.id} attempted to authenticate without a token`);
      return { event: 'authenticated', data: { success: false, error: 'No token provided' } };
    }

    try {
      const jwtSecret = this.configService.get<string>('jwt.secret');
      const payload = this.jwtService.verify(token, { secret: jwtSecret });
      const userId = payload.sub;

      if (!userId) {
        return { event: 'authenticated', data: { success: false, error: 'Invalid token payload' } };
      }

      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId)!.add(client.id);
      this.socketUserMap.set(client.id, userId);
      this.logger.log(`User ${userId} authenticated on socket ${client.id}`);
      return { event: 'authenticated', data: { success: true, userId } };
    } catch (error) {
      this.logger.warn(`Socket ${client.id} provided an invalid token`);
      return { event: 'authenticated', data: { success: false, error: 'Invalid token' } };
    }
  }

  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    // Only allow authenticated sockets to join rooms
    if (!this.socketUserMap.has(client.id)) {
      return { event: 'error', data: { message: 'Not authenticated' } };
    }

    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joined-project', data: { projectId: data.projectId } };
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'left-project', data: { projectId: data.projectId } };
  }

  emitToProject(projectId: string, event: string, data: unknown) {
    const room = `project:${projectId}`;
    this.server.to(room).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSocketMap.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  emitBoardUpdate(projectId: string, data: unknown) {
    this.emitToProject(projectId, 'board-update', data);
  }
}
