import mongoose from 'mongoose';
import { IEbookAccess, EbookAccessLevel, EbookAccessStatus } from '../models/EbookAccess';
interface GrantAccessParams {
    userId: string;
    bookId: string;
    accessLevel?: EbookAccessLevel;
    expiresAt?: Date;
    grantedBy: string;
    notes?: string;
}
interface UpdateAccessParams {
    id: string;
    accessLevel?: EbookAccessLevel;
    status?: EbookAccessStatus;
    expiresAt?: Date | null;
    notes?: string;
    updatedBy: string;
}
interface ListAccessParams {
    page?: number;
    limit?: number;
    userId?: string;
    bookId?: string;
    status?: EbookAccessStatus;
}
export declare function grantEbookAccess(params: GrantAccessParams): Promise<IEbookAccess>;
export declare function updateEbookAccess(params: UpdateAccessParams): Promise<IEbookAccess | null>;
export declare function revokeEbookAccess(id: string, revokedBy: string, revokedReason?: string): Promise<IEbookAccess | null>;
export declare function listEbookAccess(params: ListAccessParams): Promise<{
    items: (mongoose.Document<unknown, {}, IEbookAccess, {}, {}> & IEbookAccess & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function getActiveEbookAccessByUser(userId: string): Promise<(mongoose.FlattenMaps<IEbookAccess> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function expireEbookAccesses(): Promise<number>;
export {};
//# sourceMappingURL=ebookAccessService.d.ts.map