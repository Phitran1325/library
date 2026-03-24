import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import SignUpPage from "../pages/auth/SignUpPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import CategoryManager from "../pages/admin/CategoryManager";
import AuthorManager from "../pages/admin/AuthorManager";
import PublisherManager from "../pages/admin/PublisherManager";
import Reservations from "../pages/admin/Reservations";
import BorrowingRulesForm from "../pages/admin/BorrowingRulesForm";
import BorrowEligibilityChecker from "../pages/admin/BorrowEligibilityChecker";
import MembershipHistory from "../pages/admin/MembershipHistory";
import UserManagement from "../pages/admin/UserManagement";
import BookCopyStatusManagement from "../pages/librarian/BookCopyStatusManagement";
import CompensationPayment from "../pages/reader/CompensationPayment";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App là layout chính, chứa <Outlet />
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/admin/categories", element: <CategoryManager /> },
  { path: "/admin/authors", element: <AuthorManager /> },
  { path: "/admin/publishers", element: <PublisherManager /> },
  { path: "/admin/users", element: <UserManagement /> },
  { path: "/admin/reservations", element: <Reservations /> },
  { path: "/admin/borrow-rules", element: <BorrowingRulesForm /> },
  { path: "/admin/borrow-eligibility", element: <BorrowEligibilityChecker /> },
  { path: "/admin/membership-history", element: <MembershipHistory /> },
  { path: "/librarian/book-copies", element: <BookCopyStatusManagement /> },
  { path: "/reader/compensation", element: <CompensationPayment /> },
    ],
  },
]);

export default router;