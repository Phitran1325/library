import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { seedMembershipPlans } from './config/seedMembershipPlans';

// Route modules
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import categoryRoutes from './routes/categories';
import publisherRoutes from './routes/publishers';
import authorRoutes from './routes/authors';
import bookRoutes from './routes/books';
import bookCopyRoutes from './routes/bookCopies';
import librarianBookRoutes from './routes/librarianBooks';
import librarianStatisticsRoutes from './routes/librarianStatistics';
import librarianMembershipRoutes from './routes/librarianMemberships';
import publicBookRoutes from './routes/publicBooks';
import tagRoutes from './routes/tags';
import reservationRoutes from './routes/reservations';
import favoriteBookRoutes from './routes/favoriteBooks';
import borrowRoutes from './routes/borrows';
import membershipRoutes from './routes/memberships';
import paymentRoutes from './routes/payments';
import adminMembershipRoutes from './routes/adminMemberships';
import reviewRoutes from './routes/reviews';
import notificationRoutes from './routes/notifications';
import messageRoutes from './routes/messages';
import reminderRoutes from './routes/reminders';
import ebookAccessRoutes from './routes/ebookAccess';
import ebookReaderRoutes from './routes/ebookReader';
import dashboardRoutes from './routes/dashboard';
import ebookContentReportRoutes from './routes/ebookContentReports';

// Jobs & services
import { startBorrowCronJobs } from './jobs/borrowCronJobs';
import { startReservationCronJobs } from './jobs/reservationCronJobs';
import websocketService from './services/websocketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ------------------------- Middleware -------------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

async function bootstrap() {
  // --------------------- Database & Seed ----------------------
  await connectDB();

  try {
    await seedMembershipPlans();
    console.log('✅ Seeded membership plans');
  } catch (err) {
    console.error('🚨 Failed to seed membership plans', err);
  }

  // ----------------------- Cron Jobs --------------------------
  if (process.env.NODE_ENV !== 'test') {
    startBorrowCronJobs();
    startReservationCronJobs();
  }

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/publishers', publisherRoutes);
app.use('/api/admin/authors', authorRoutes);
app.use('/api/admin/books', bookRoutes);
  app.use('/api/librarian/books', librarianBookRoutes);
  app.use('/api/librarian/book-copies', bookCopyRoutes);
app.use('/api/admin/tags', tagRoutes);
app.use('/api/reservations', reservationRoutes);
  app.use('/api/borrows', borrowRoutes);
  app.use('/api/memberships', membershipRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin-memberships', adminMembershipRoutes);

  // Librarian
  app.use('/api/librarian/books', librarianBookRoutes);
  app.use('/api/librarian/book-copies', bookCopyRoutes);
  app.use('/api/librarian/borrows', borrowRoutes);
  app.use('/api/librarian/statistics', librarianStatisticsRoutes);
  app.use('/api/librarian/membership-requests', librarianMembershipRoutes);

  // Member-facing business flows
  app.use('/api/borrows', borrowRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/favorite-books', favoriteBookRoutes);
  app.use('/api/memberships', membershipRoutes);
  app.use('/api/payments', paymentRoutes);

  // New messaging/notification/review features
  app.use('/api/messages', messageRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/ebook-access', ebookAccessRoutes);
  app.use('/api/ebook-reader', ebookReaderRoutes);
  app.use('/api/ebook-content-reports', ebookContentReportRoutes);

  // Public catalog
  app.use('/api/books', publicBookRoutes);

  // Dashboard statistics (public)
  app.use('/api/dashboard', dashboardRoutes);

  // --------------------- Error Handler ------------------------
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  });

  // -------------------- Start HTTP & WS -----------------------
  websocketService.initialize(httpServer);

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📡 WebSocket server ready');
  });
}

bootstrap();