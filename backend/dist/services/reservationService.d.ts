import { IReservation } from '../models/Reservation';
export interface ReservationValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Kiểm tra điều kiện đặt sách
 */
export declare function validateReservation(userId: string, bookId: string): Promise<ReservationValidationResult>;
/**
 * Tạo yêu cầu đặt sách
 */
export declare function createReservation(userId: string, bookId: string): Promise<IReservation>;
/**
 * Gán reservation cho user (khi sách có sẵn)
 */
export declare function assignReservationToUser(reservationId: string): Promise<IReservation | null>;
/**
 * Duyệt reservation bởi thủ thư
 */
export declare function approveReservation(reservationId: string, librarianId: string): Promise<IReservation>;
/**
 * Hủy reservation
 */
export declare function cancelReservation(reservationId: string, userId?: string): Promise<IReservation>;
/**
 * Hoàn thành reservation (user đến lấy sách)
 */
export declare function fulfillReservation(reservationId: string): Promise<{
    reservation: IReservation;
    borrow: any;
}>;
/**
 * Cập nhật vị trí trong hàng chờ cho tất cả reservations của một cuốn sách
 */
export declare function updateQueuePositions(bookId: string): Promise<void>;
/**
 * Gán reservation tiếp theo khi có sách được trả
 */
export declare function assignNextReservation(bookId: string): Promise<IReservation | null>;
/**
 * Xử lý các reservation hết hạn
 */
export declare function expireReservations(): Promise<{
    totalExpired: number;
    expiredReservations: IReservation[];
}>;
/**
 * Gửi email nhắc nhở reservation sắp hết hạn
 */
export declare function sendExpiryReminders(): Promise<void>;
//# sourceMappingURL=reservationService.d.ts.map