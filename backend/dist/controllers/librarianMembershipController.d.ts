import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
/**
 * Get all membership requests (for librarians)
 * GET /api/librarian/membership-requests
 */
export declare const listMembershipRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get a single membership request by ID
 * GET /api/librarian/membership-requests/:id
 */
export declare const getMembershipRequestById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Approve a membership request
 * POST /api/librarian/membership-requests/:id/approve
 */
export declare const approveMembershipRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Reject a membership request
 * POST /api/librarian/membership-requests/:id/reject
 */
export declare const rejectMembershipRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get membership requests for current user
 * GET /api/memberships/my-requests
 */
export declare const getMyMembershipRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=librarianMembershipController.d.ts.map