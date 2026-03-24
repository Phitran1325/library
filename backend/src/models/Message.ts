import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId; // Optional: null means sent to all librarians
  content: string;
  conversationId: string; // Unique ID for reader-librarian conversation
  senderRole: 'Reader' | 'Librarian';
  receiverRole?: 'Reader' | 'Librarian';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' }, // null for reader->all librarians
    content: { type: String, required: true, trim: true },
    conversationId: { type: String, required: true, index: true }, // Format: readerId_librarianId or readerId_all
    senderRole: { type: String, enum: ['Reader', 'Librarian'], required: true },
    receiverRole: { type: String, enum: ['Reader', 'Librarian'] },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);

