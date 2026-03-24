"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const seedMembershipPlans_1 = require("./config/seedMembershipPlans");
// Route modules
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const categories_1 = __importDefault(require("./routes/categories"));
const publishers_1 = __importDefault(require("./routes/publishers"));
const authors_1 = __importDefault(require("./routes/authors"));
const books_1 = __importDefault(require("./routes/books"));
const bookCopies_1 = __importDefault(require("./routes/bookCopies"));
const librarianBooks_1 = __importDefault(require("./routes/librarianBooks"));
const librarianStatistics_1 = __importDefault(require("./routes/librarianStatistics"));
const publicBooks_1 = __importDefault(require("./routes/publicBooks"));
const tags_1 = __importDefault(require("./routes/tags"));
const reservations_1 = __importDefault(require("./routes/reservations"));
const favoriteBooks_1 = __importDefault(require("./routes/favoriteBooks"));
const borrows_1 = __importDefault(require("./routes/borrows"));
const memberships_1 = __importDefault(require("./routes/memberships"));
const payments_1 = __importDefault(require("./routes/payments"));
const adminMemberships_1 = __importDefault(require("./routes/adminMemberships"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const messages_1 = __importDefault(require("./routes/messages"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const ebookAccess_1 = __importDefault(require("./routes/ebookAccess"));
const ebookReader_1 = __importDefault(require("./routes/ebookReader"));
// Jobs & services
const borrowCronJobs_1 = require("./jobs/borrowCronJobs");
const websocketService_1 = __importDefault(require("./services/websocketService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ------------------------- Middleware -------------------------
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
async function bootstrap() {
    // --------------------- Database & Seed ----------------------
    await (0, database_1.default)();
    try {
        await (0, seedMembershipPlans_1.seedMembershipPlans)();
        console.log('✅ Seeded membership plans');
    }
    catch (err) {
        console.error('🚨 Failed to seed membership plans', err);
    }
    // ----------------------- Cron Jobs --------------------------
    if (process.env.NODE_ENV !== 'test') {
        (0, borrowCronJobs_1.startBorrowCronJobs)();
    }
    // ------------------------- Routes ---------------------------
    // Auth & users
    app.use('/api/auth', auth_1.default);
    app.use('/api/users', users_1.default);
    // Admin management
    app.use('/api/admin', admin_1.default);
    app.use('/api/categories', categories_1.default);
    app.use('/api/admin/publishers', publishers_1.default);
    app.use('/api/admin/authors', authors_1.default);
    app.use('/api/admin/books', books_1.default);
    app.use('/api/admin/tags', tags_1.default);
    app.use('/api/admin/memberships', adminMemberships_1.default);
    // Librarian
    app.use('/api/librarian/books', librarianBooks_1.default);
    app.use('/api/librarian/book-copies', bookCopies_1.default);
    app.use('/api/librarian/borrows', borrows_1.default);
    app.use('/api/librarian/statistics', librarianStatistics_1.default);
    // Member-facing business flows
    app.use('/api/borrows', borrows_1.default);
    app.use('/api/reservations', reservations_1.default);
    app.use('/api/favorite-books', favoriteBooks_1.default);
    app.use('/api/memberships', memberships_1.default);
    app.use('/api/payments', payments_1.default);
    // New messaging/notification/review features
    app.use('/api/messages', messages_1.default);
    app.use('/api/reviews', reviews_1.default);
    app.use('/api/notifications', notifications_1.default);
    app.use('/api/reminders', reminders_1.default);
    app.use('/api/ebook-access', ebookAccess_1.default);
    app.use('/api/ebook-reader', ebookReader_1.default);
    // Public catalog
    app.use('/api/books', publicBooks_1.default);
    // --------------------- Error Handler ------------------------
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    });
    // -------------------- Start HTTP & WS -----------------------
    websocketService_1.default.initialize(httpServer);
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log('📡 WebSocket server ready');
    });
}
bootstrap();
//# sourceMappingURL=server.js.map