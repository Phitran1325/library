import mongoose from 'mongoose';
export declare function getActiveSubscription(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/MembershipSubscription").IMembershipSubscription, {}, {}> & import("../models/MembershipSubscription").IMembershipSubscription & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function createOrSwitchSubscription(userId: string, planId: string, options?: {
    previousSubscriptionId?: string;
    source?: 'Payment' | 'Admin';
}): Promise<Omit<mongoose.Document<unknown, {}, import("../models/MembershipSubscription").IMembershipSubscription, {}, {}> & import("../models/MembershipSubscription").IMembershipSubscription & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, never>>;
export declare function renewAfterExpired(userId: string, planId: string, options?: {
    source?: 'Payment' | 'Admin';
}): Promise<Omit<mongoose.Document<unknown, {}, import("../models/MembershipSubscription").IMembershipSubscription, {}, {}> & import("../models/MembershipSubscription").IMembershipSubscription & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, never>>;
//# sourceMappingURL=membershipService.d.ts.map