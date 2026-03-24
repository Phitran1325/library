import { Document, Model } from 'mongoose';
export interface BlacklistedTokenDocument extends Document {
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
declare const BlacklistedToken: Model<BlacklistedTokenDocument>;
export default BlacklistedToken;
//# sourceMappingURL=BlacklistedToken.d.ts.map