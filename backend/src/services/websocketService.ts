import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Message from '../models/Message';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map(); // userId -> socket
  private librarianSockets: Set<string> = new Set(); // Set of librarian userIds

  initialize(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = decoded.userId;
        socket.userRole = user.role;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    console.log('✅ WebSocket server initialized');
  }

  private handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    const userRole = socket.userRole!;

    console.log(`User connected: ${userId} (${userRole})`);

    // Store connected user
    this.connectedUsers.set(userId, socket);

    // Track librarians
    if (userRole === 'Librarian') {
      this.librarianSockets.add(userId);
      // Notify all librarians about new connection (optional)
      this.io?.to('librarians').emit('librarian_online', { userId });
    }

    // Join role-based rooms
    socket.join(userRole.toLowerCase());
    socket.join(userId); // Join personal room for direct messages

    if (userRole === 'Librarian') {
      socket.join('librarians');
    }

    // Handle sending messages
    socket.on('send_message', async (data: { content: string; receiverId?: string; conversationId?: string }) => {
      try {
        await this.handleSendMessage(socket, data);
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      this.handleTyping(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${userRole})`);
      this.connectedUsers.delete(userId);
      
      if (userRole === 'Librarian') {
        this.librarianSockets.delete(userId);
        this.io?.to('librarians').emit('librarian_offline', { userId });
      }
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: { content: string; receiverId?: string; conversationId?: string }) {
    const senderId = socket.userId!;
    const senderRole = socket.userRole!;
    const { content, receiverId, conversationId } = data;

    if (!content || !content.trim()) {
      socket.emit('error', { message: 'Message content is required' });
      return;
    }

    const sender = await User.findById(senderId);
    if (!sender) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    let finalConversationId = conversationId;
    let finalReceiverId = receiverId || null;

    if (senderRole === 'Reader') {
      // Reader sends to all librarians
      finalConversationId = `${senderId}_all`;
      finalReceiverId = null;

      // Create message in database
      const message = new Message({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: null,
        content: content.trim(),
        conversationId: finalConversationId,
        senderRole: 'Reader',
        isRead: false
      });

      await message.save();
      await message.populate('senderId', 'fullName avatar');
      await message.populate('receiverId', 'fullName avatar');

      // Broadcast to all connected librarians
      this.io?.to('librarians').emit('new_message', {
        message,
        conversationId: finalConversationId,
        readerId: senderId
      });

      // Also send confirmation to sender
      socket.emit('message_sent', { message, conversationId: finalConversationId });

    } else if (senderRole === 'Librarian') {
      // Librarian sends to specific reader
      if (!receiverId) {
        socket.emit('error', { message: 'Librarian must specify receiverId' });
        return;
      }

      const receiver = await User.findById(receiverId);
      if (!receiver || receiver.role !== 'Reader') {
        socket.emit('error', { message: 'Invalid receiver. Must be a Reader' });
        return;
      }

      finalConversationId = `${receiverId}_all`;
      finalReceiverId = receiverId;

      // Create message in database
      const message = new Message({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        content: content.trim(),
        conversationId: finalConversationId,
        senderRole: 'Librarian',
        receiverRole: 'Reader',
        isRead: false
      });

      await message.save();
      await message.populate('senderId', 'fullName avatar');
      await message.populate('receiverId', 'fullName avatar');

      // Send to specific reader
      const readerSocket = this.connectedUsers.get(receiverId);
      if (readerSocket) {
        readerSocket.emit('new_message', {
          message,
          conversationId: finalConversationId
        });
      }

      // Send confirmation to librarian sender
      socket.emit('message_sent', { message, conversationId: finalConversationId });

      // Notify other librarians about the reply (optional - for coordination)
      socket.to('librarians').emit('librarian_replied', {
        conversationId: finalConversationId,
        readerId: receiverId,
        librarianId: senderId
      });
    } else {
      socket.emit('error', { message: 'Access denied' });
    }
  }

  private handleTyping(socket: AuthenticatedSocket, data: { conversationId: string; isTyping: boolean }) {
    const userId = socket.userId!;
    const userRole = socket.userRole!;
    const { conversationId, isTyping } = data;

    if (userRole === 'Reader') {
      // Reader typing - notify all librarians
      socket.to('librarians').emit('typing', {
        conversationId,
        userId,
        isTyping
      });
    } else if (userRole === 'Librarian') {
      // Librarian typing - notify specific reader
      const readerId = conversationId.split('_')[0];
      const readerSocket = this.connectedUsers.get(readerId);
      if (readerSocket) {
        readerSocket.emit('typing', {
          conversationId,
          userId,
          isTyping
        });
      }
    }
  }

  // Get connected librarians count
  getConnectedLibrariansCount(): number {
    return this.librarianSockets.size;
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

export default new WebSocketService();

