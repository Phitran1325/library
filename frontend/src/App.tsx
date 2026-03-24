import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/auth/LoginPage.tsx";
import BookList from "./pages/Book/BookList.tsx";
import BookDetail from "./pages/Book/BookDetail.tsx";
import MyBorrows from "./pages/Book/MyBorrows.tsx";
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/common/Notification';
import DefaultLayout from "./layouts/DefaultLayout.tsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.tsx";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage.tsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.tsx";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop.tsx";
import MyReservations from "./pages/Book/MyReservations/MyReservations.tsx";
import ProtectedRoute from "./components/common/ProtectedRoute.tsx";
import UnauthorizedPage from "./pages/Error/UnauthorizedPage.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import LibrarianLayout from "./layouts/LibrarianLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import CategoryManager from "./pages/admin/CategoryManager.tsx";
import AuthorManager from "./pages/admin/AuthorManager.tsx";
import PublisherManager from "./pages/admin/PublisherManager.tsx";
import BorrowEligibilityChecker from "./pages/admin/BorrowEligibilityChecker.tsx";
import MembershipHistory from "./pages/admin/MembershipHistory.tsx";
import UserManagement from "./pages/admin/UserManagement.tsx";
import UserStatistics from "./pages/admin/UserStatistics.tsx";
import LibrarianDashboard from "./pages/librarian/LibrarianDashboard.tsx";
import LibrarianBookManagement from "./pages/librarian/LibrarianBookManagement.tsx";
import LibrarianAddBook from "./pages/librarian/LibrarianAddBook.tsx";
import LibrarianBookDetail from "./pages/librarian/LibrarianBookDetail.tsx";
import LibrarianEditBook from "./pages/librarian/LibrarianEditBook.tsx";
import BookCopyStatusManagement from "./pages/librarian/BookCopyStatusManagement.tsx";
import LibrarianBookCopies from "./pages/librarian/LibrarianBookCopies.tsx";
import LibrarianReminders from "./pages/librarian/LibrarianReminders.tsx";
import LibrarianReservations from "./pages/librarian/LibrarianReservations.tsx";
import CompensationPayment from "./pages/reader/CompensationPayment.tsx";
import { Role } from "./types";
import LibrarianBorrowManagement from "./pages/librarian/LibrarianBorrowManagement";
import DebtPaymentManagement from "./pages/librarian/DebtPaymentManagement";
import LibrarianMembershipManagement from "./pages/librarian/LibrarianMembershipManagement";
import MyFavorites from "./pages/Book/Myfavorites.tsx";
import ProfilePage from "./pages/Profiles/ProfilePage";
import MembershipPlanDetail from "./pages/Membership/MembershipPlans.tsx";
import About from "./pages/Info/About.tsx";
import Rules from "./pages/Info/Rules.tsx";
import Contact from "./pages/Info/Contact.tsx";
import Guide from "./pages/Info/Guide.tsx";
import FAQ from "./pages/Info/FAQ.tsx";
import Policy from "./pages/Info/Policy.tsx";
import { EbookReaderPage } from "./pages/reader/EbookReaderPage.tsx";
import EbookReportManagement from "./pages/admin/EbookReportManagement.tsx";
import BookStatistics from "./pages/admin/BookStatistics.tsx";


import ChatPage from "./pages/Chat/ChatPage.tsx";
import Error from "./pages/Error/Error.tsx";
import SignUpPage from "./pages/auth/SignupPage.tsx";
// import { useTokenValidation } from "./hooks/useTokenValidation";

function AppContent() {
  // TODO: Enable when backend implements /auth/me endpoint
  // Validate token periodically to check if account is locked
  // useTokenValidation();
  // import ChatPage from "./pages/Chat/ChatPage.tsx";



  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<DefaultLayout />} >
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route element={<DefaultLayout />} ><Route path="/books" element={<BookList />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/books/:id" element={<BookDetail />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/my-borrows" element={<MyBorrows />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/my-reservations" element={<MyReservations />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/my-favorites" element={<MyFavorites />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/membership" element={<MembershipPlanDetail />} /></Route>

      {/* Info Pages */}
      <Route element={<DefaultLayout />} ><Route path="/about" element={<About />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/rules" element={<Rules />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/contact" element={<Contact />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/guide" element={<Guide />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/faq" element={<FAQ />} /></Route>
      <Route element={<DefaultLayout />} ><Route path="/policy" element={<Policy />} /></Route>


      <Route path="/reader/:bookId" element={<EbookReaderPage />} />

      {/* Chat Page - Full screen without layout */}
      <Route path="/chat" element={<ChatPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />



      {/* Admin Routes - Only for ADMIN role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={[Role.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="book-statistics" element={<BookStatistics />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="publishers" element={<PublisherManager />} />
        <Route path="authors" element={<AuthorManager />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/statistics" element={<UserStatistics />} />
        <Route path="borrow-eligibility" element={<BorrowEligibilityChecker />} />
        <Route path="membership-history" element={<MembershipHistory />} />
        <Route path="ebook-reports" element={<EbookReportManagement />} />
      </Route>

      {/* Librarian Routes - For LIBRARIAN and ADMIN roles */}
      <Route
        path="/librarian"
        element={
          <ProtectedRoute requiredRoles={[Role.LIBRARIAN, Role.ADMIN]}>
            <LibrarianLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LibrarianDashboard />} />
        <Route path="books" element={<LibrarianBookManagement />} />
        <Route path="books/add" element={<LibrarianAddBook />} />
        <Route path="books/:id" element={<LibrarianBookDetail />} />
        <Route path="books/edit/:id" element={<LibrarianEditBook />} />
        <Route path="borrows" element={<LibrarianBorrowManagement />} />
        <Route path="debt-payments" element={<DebtPaymentManagement />} />
        <Route path="memberships" element={<LibrarianMembershipManagement />} />
        {/* Add more librarian routes here as needed */}
        <Route path="book-copies" element={<LibrarianBookCopies />} />
        <Route path="book-copies/status" element={<BookCopyStatusManagement />} />
        <Route path="reminders" element={<LibrarianReminders />} />
        <Route path="reservations" element={<LibrarianReservations />} />
        <Route path="ebook-reports" element={<EbookReportManagement />} />
      </Route>


      {/* Reader Routes */}
      <Route element={<DefaultLayout />}>
        <Route path="/reader/compensation" element={<CompensationPayment />} />
      </Route>
      {/* ✅ Trang đọc ebook FULLSCREEN: không dùng DefaultLayout */}
      <Route path="/reader/:bookId" element={<EbookReaderPage />} />

      {/* Fallback error nếu cần */}
      <Route path="*" element={<Error />} />
    </Routes>

  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ScrollToTop />
        <AppContent />
      </NotificationProvider>
    </AuthProvider>

  );
}

export default App;
