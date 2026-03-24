import { Request, Response } from 'express';
import Message from '../models/Message';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
}

type UserReference = mongoose.Types.ObjectId | (IUser & { _id: mongoose.Types.ObjectId });

const getPopulatedUser = (ref?: UserReference | null) => {
  if (ref && typeof ref === 'object' && 'fullName' in ref) {
    return ref as IUser & { _id: mongoose.Types.ObjectId };
  }
  return null;
};

const getUserIdString = (ref?: UserReference | null) => {
  if (!ref) return null;
  if (typeof (ref as any)._id !== 'undefined') {
    return ((ref as any)._id as mongoose.Types.ObjectId).toString();
  }
  return (ref as mongoose.Types.ObjectId).toString();
};

// Get all conversations for the current user
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let conversations: any[] = [];

    if (userRole === 'Reader') {
      // Get all unique conversations where reader is involved
      const messages = await Message.find({
        $or: [
          { senderId: userId },
          { receiverId: userId, receiverRole: 'Reader' }
        ]
      })
        .sort({ createdAt: -1 })
        .populate('senderId', 'fullName avatar')
        .populate('receiverId', 'fullName avatar');

      // Group by conversationId
      const conversationMap = new Map();
      messages.forEach((msg) => {
        const convId = msg.conversationId;
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            conversationId: convId,
            lastMessage: msg,
            unreadCount: 0,
            participant: { role: 'Librarian', name: 'Thủ thư' }
          });
        }
        const senderIdStr = getUserIdString(msg.senderId as UserReference);
        if (!msg.isRead && senderIdStr && senderIdStr !== userId) {
          conversationMap.get(convId).unreadCount++;
        }
      });

      conversations = Array.from(conversationMap.values());
    } else if (userRole === 'Librarian') {
      // Get all conversations where librarian is involved or can see (reader messages to all)
      const messages = await Message.find({
        $or: [
          { senderId: userId },
          { receiverId: userId },
          { senderRole: 'Reader', receiverId: null } // Reader messages to all librarians
        ]
      })
        .sort({ createdAt: -1 })
        .populate('senderId', 'fullName avatar email')
        .populate('receiverId', 'fullName avatar email');

      // Group by conversationId
      const conversationMap = new Map();
      messages.forEach((msg) => {
        // For reader messages, use senderId as conversation identifier
        const convId = msg.conversationId;
        const readerRef = (msg.senderRole === 'Reader' ? msg.senderId : msg.receiverId) as UserReference;
        const readerId = getUserIdString(readerRef);
        const readerDoc = getPopulatedUser(readerRef);

        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            conversationId: convId,
            readerId,
            lastMessage: msg,
            unreadCount: 0,
            participant: {
              role: 'Reader',
              name: readerDoc?.fullName || 'Unknown',
              avatar: readerDoc?.avatar,
              email: readerDoc?.email
            }
          });
        }
        const senderIdStr = getUserIdString(msg.senderId as UserReference);
        if (!msg.isRead && senderIdStr && senderIdStr !== userId) {
          conversationMap.get(convId).unreadCount++;
        }
      });

      conversations = Array.from(conversationMap.values());
    }

    res.json({
      success: true,
      conversations: conversations.sort((a, b) => 
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      )
    });
  } catch (error: any) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify user has access to this conversation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify access to conversation
    if (user.role === 'Reader') {
      // Reader can only see their own conversations
      const readerId = conversationId.split('_')[0];
      if (readerId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (user.role === 'Librarian') {
      // Librarian can see conversations with any reader
      // conversationId format: readerId_all
      // No additional check needed - all librarians can see all reader conversations
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Query all messages in this conversation
    const query = { conversationId };

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName avatar')
      .populate('receiverId', 'fullName avatar')
      .limit(100); // Limit to last 100 messages

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      messages
    });
  } catch (error: any) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Send a message (REST API endpoint - WebSocket will also use this logic)
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { content, receiverId, conversationId } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    let finalConversationId = conversationId;
    let finalReceiverId = receiverId || null;

    if (sender.role === 'Reader') {
      // Reader sends to all librarians
      finalConversationId = `${userId}_all`;
      finalReceiverId = null;
    } else if (sender.role === 'Librarian') {
      // Librarian must specify receiverId (reader)
      if (!receiverId) {
        return res.status(400).json({ message: 'Librarian must specify receiverId' });
      }
      const receiver = await User.findById(receiverId);
      if (!receiver || receiver.role !== 'Reader') {
        return res.status(400).json({ message: 'Invalid receiver. Must be a Reader' });
      }
      // Use readerId_all format for consistency
      finalConversationId = `${receiverId}_all`;
      finalReceiverId = receiverId;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      senderId: userId,
      receiverId: finalReceiverId,
      content: content.trim(),
      conversationId: finalConversationId,
      senderRole: sender.role,
      receiverRole: finalReceiverId ? 'Reader' : undefined,
      isRead: false
    });

    await message.save();
    await message.populate('senderId', 'fullName avatar');
    await message.populate('receiverId', 'fullName avatar');

    res.json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let updateQuery: any;

    if (userRole === 'Reader') {
      // Reader marks messages sent to them as read
      updateQuery = {
        conversationId,
        receiverId: userId,
        isRead: false
      };
    } else if (userRole === 'Librarian') {
      // Librarian marks all unread messages in this conversation (from reader) as read
      // Reader messages have senderRole='Reader' and receiverId=null (sent to all librarians)
      updateQuery = {
        conversationId,
        senderRole: 'Reader',
        isRead: false
      };
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await Message.updateMany(updateQuery, { isRead: true });

    res.json({ 
      success: true, 
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

