/* eslint-disable @typescript-eslint/no-floating-promises */
import { NotFoundException, UseGuards } from '@nestjs/common';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Auth } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { CacheService, TokenService } from 'src/common/service';
import { TokenTypeEnum } from 'src/common/enum';
import { parseCookie } from 'cookie';
@WebSocketGateway(3001, { cors: '*'  , credentials: true})
export class RealtimeGetway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly redis: CacheService,
    private readonly tokenService: TokenService
  ) {}
  @WebSocketServer()
  Server!: Server;
  afterInit(server: Server) {
    console.log(`Connected successfuly with sockt io ✅✅✅`);
  }

async handleConnection(client: Socket) {
  console.log(`Connected with client id ${client.id} ❤️`);

  try {
    const cookies = parseCookie(client.handshake.headers.cookie ?? '');

    const token =
      cookies.accessToken ||
      client.handshake.auth?.authorization ||
      client.handshake.headers?.authorization;

    if (!token) {
      throw new NotFoundException('Authentication error: Token missing');
    }

    const credential = token.startsWith('Bearer ')
      ? token.slice(7)
      : token;

    const { user, decode } =
      await this.tokenService.decodedToken({
        token: credential,
        tokenType: TokenTypeEnum.ACCESS,
      });

    client.data = { user, decode };

    await this.redis.addSocketId(
      user._id.toString(),
      client.id,
    );

    client.join(`user:${user._id.toString()}`);

    if (user.role) {
      client.join(`role:${user.role}`);
    }

    if (
      Array.isArray(user.permissions) &&
      user.permissions.length > 0
    ) {
      for (const permission of user.permissions) {
        client.join(`permission:${permission}`);
      }
    }

    console.log(
      `✅ User ${user._id.toString()} (${user.role}) connected to socket`,
    );

  } catch (error: any) {
    console.error('❌ Socket authentication error:', error.message);

    client.emit('custom_error', error.message);
    client.disconnect();
  }
}

  async handleDisconnect(client: Socket) {
    console.log(`Disconnected client ${client.id} ❌`);
    try {
      const userId = client.data.user?._id;
      if (!userId) return;

      await this.redis.removeSocketId(userId.toString(), client.id);

      const sockets = await this.redis.getSocketIds(userId.toString());

      if (sockets.length === 0) {
        this.Server.emit('offline_user', { userId });
        console.log(`🔴 User ${userId} is now completely OFFLINE`);
      } else {
        console.log(
          `ℹ️ User ${userId} still has ${sockets.length} active connection(s).`
        );
      }
    } catch (error: any) {
      client.emit('custom_error', error.message);
    }
  }

  async getRoomMembers(roomName: string) {
    const sockets = await this.Server.in(roomName).fetchSockets();
    return sockets.map((s) => ({
     socketId: s.id,
     userId: s.data.user?._id,
     userRole: s.data.user?.role,
     userPermissions: s.data.user?.permissions,
    }));
  }

  @Auth({})
  @SubscribeMessage('lowStockThreshold')
  lowStockThreshold(
    @MessageBody() data: string,
    @Ack() ack: { response: { status: 200; message: 'done' } },
    @ConnectedSocket() client: Socket
  ) {
    this.Server.emit('lowStockThreshold', 'welcome back!');
    return `Received`;
  }

  @SubscribeMessage('debug_room')
  async handleDebugRoom(@MessageBody() roomName: string,@ConnectedSocket() client: Socket) {
   const members = await this.getRoomMembers(roomName);
   console.log(`🔍 [DEBUG] Room: ${roomName}`, members);
   return { status: 'success', roomName, totalMembers: members.length, members };
  }
  
  async sendToUser(userId: string, eventName: string, data: any) {
    this.Server.to(`user:${userId}`).emit(eventName , data)
  }
  async sendToRole(role: RoleEnum, eventName: string, data: any) {
    this.Server.to(`role:${role}`).emit(eventName , data)
  }
  async broadcast(eventName: string, data: any) {
    this.Server.emit(eventName , data)
  }
  async sendToPermission(permission: PermissionEnum, eventName: string, data: any) {
    this.Server.to(`permission:${permission}`).emit(eventName, data);
  }
}
