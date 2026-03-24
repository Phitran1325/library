import * as cron from 'node-cron';
import { expireReservations, sendExpiryReminders } from '../services/reservationService';

/**
 * Cron job chạy mỗi 10 phút để:
 * 1. Xử lý reservation hết hạn
 * 2. Gửi email nhắc nhở reservation sắp hết hạn
 */
export function startReservationCronJobs() {
  // Chạy mỗi 10 phút
  cron.schedule('*/10 * * * *', async () => {
    console.log('Running reservation cron job at', new Date().toISOString());
    
    try {
      // Xử lý reservation hết hạn
      const expireResult = await expireReservations();
      if (expireResult.totalExpired > 0) {
        console.log(`Expired ${expireResult.totalExpired} reservations`);
      }
      
      // Gửi email nhắc nhở reservation sắp hết hạn
      await sendExpiryReminders();
      
      console.log('Reservation cron job completed successfully');
    } catch (error) {
      console.error('Error in reservation cron job:', error);
    }
  });
  
  console.log('Reservation cron jobs started');
}