import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import type { JwtPayload } from './auth/jwt-payload';

const socketCorsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : true;

@WebSocketGateway({
  cors: {
    origin: socketCorsOrigin,
    credentials: true,
  },
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrderGateway.name);

  constructor(private jwt: JwtService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Pull and verify the JWT carried in the socket handshake.
   * Clients pass it via `io(url, { auth: { token } })` or `?token=`.
   */
  private verify(client: Socket): JwtPayload | null {
    const token =
      ((client.handshake.auth as Record<string, unknown> | undefined)?.token as
        | string
        | undefined) ||
      ((client.handshake.query as Record<string, unknown> | undefined)?.token as
        | string
        | undefined);
    if (!token) return null;
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  // STAFF can only subscribe to their own branch room. ADMIN can join any.
  @SubscribeMessage('join-branch')
  handleJoinBranch(client: Socket, branchId: string) {
    const me = this.verify(client);
    if (!me) return;
    if (me.role === 'ADMIN') {
      void client.join(`branch-${branchId}`);
      return;
    }
    if (me.role === 'STAFF' && me.branchId === branchId) {
      void client.join(`branch-${branchId}`);
      return;
    }
    this.logger.warn(
      `Rejected join-branch for client ${client.id} (role=${me.role}, branchId=${branchId})`,
    );
  }

  @SubscribeMessage('join-admin')
  handleJoinAdmin(client: Socket) {
    const me = this.verify(client);
    if (me?.role !== 'ADMIN') return;
    void client.join('admin');
  }

  @SubscribeMessage('join-customer')
  handleJoinCustomer(client: Socket, customerUid: string) {
    const me = this.verify(client);
    if (!me || !customerUid) return;
    // ADMIN can subscribe to any customer's stream. CUSTOMER may subscribe to
    // their own LINE UID / user.id (Order.customerUid is one of these). We
    // don't strictly bind to me.sub here because the buyer-liff flow stores
    // either the LINE UID or the User.id depending on path; tightening that
    // requires unifying the customer key first.
    if (me.role === 'ADMIN' || me.role === 'CUSTOMER') {
      void client.join(`customer-${customerUid}`);
    }
  }

  notifyNewOrder(branchId: string, order: any) {
    this.server.to(`branch-${branchId}`).emit('new-order', order);
    this.server.to('admin').emit('new-order', order);
    if (order?.customerUid) {
      this.server.to(`customer-${order.customerUid}`).emit('new-order', order);
    }
  }

  notifyUpdateOrder(branchId: string, order: any) {
    this.server.to(`branch-${branchId}`).emit('update-order', order);
    this.server.to('admin').emit('update-order', order);
    if (order?.customerUid) {
      this.server
        .to(`customer-${order.customerUid}`)
        .emit('update-order', order);
    }
  }

  notifyInventoryAlert(branchId: string, alerts: any[]) {
    this.server.to(`branch-${branchId}`).emit('inventory-alert', alerts);
    this.server.to('admin').emit('inventory-alert', { branchId, alerts });
  }

  /** Broadcast updated system settings to every connected client. */
  broadcastSettings(settings: Record<string, string>) {
    this.server.emit('settings-updated', settings);
  }
}
