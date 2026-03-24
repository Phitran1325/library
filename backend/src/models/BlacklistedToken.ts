import mongoose, { Schema, Document, Model } from 'mongoose';

export interface BlacklistedTokenDocument extends Document {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const BlacklistedTokenSchema: Schema<BlacklistedTokenDocument> = new Schema(
  {
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index: document will be removed automatically when expiresAt passes
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken: Model<BlacklistedTokenDocument> =
  mongoose.models.BlacklistedToken ||
  mongoose.model<BlacklistedTokenDocument>('BlacklistedToken', BlacklistedTokenSchema);

export default BlacklistedToken;



