import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

// =============================
// AXIOS INSTANCE + INTERCEPTOR
// =============================
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  }
);

// =====================
// 🔹 TYPES
// =====================
export type DebtPaymentStatus = "Pending" | "Approved" | "Rejected";
export type DebtPaymentMethod = "Manual" | "PayOS" | "External";

export type DebtInfo = {
  totalDebt: number;
  unpaidBorrows: Array<{
    _id: string;
    book: { title: string };
    lateFee: number;
    damageFee: number;
    status: string;
    dueDate: string;
    returnDate?: string;
  }>;
  overdueBorrows: Array<{
    _id: string;
    book: { title: string };
    lateFee: number;
    status: string;
    dueDate: string;
  }>;
};

export type DebtPaymentHistoryItem = {
  _id: string;
  amount: number;
  method: DebtPaymentMethod;
  status: DebtPaymentStatus;
  debtBefore: number;
  debtAfter: number;
  createdAt: string;
};

export type CreatePaymentRequestResult = {
  paymentRequest: DebtPaymentHistoryItem;
  debtBefore: number;
  debtAfterEstimate: number;
};

// =====================
// 🔥 API SERVICE
// =====================
export const debtPaymentService = {
  /**
   * Get current debt info
   */
  getDebtInfo: async (): Promise<DebtInfo> => {
    const res = await api.get("/payments/debt/info");
    return res.data?.data ?? res.data;
  },

  /**
   * Get user payment history
   */
  getHistory: async (): Promise<DebtPaymentHistoryItem[]> => {
    const res = await api.get("/payments/debt/history", {
      params: { limit: 50, page: 1 },
    });

    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data?.history)) return res.data.data.history;
    if (Array.isArray(res.data?.data)) return res.data.data;

    return [];
  },

  /**
   * Create manual payment request
   */
  createPaymentRequest: async (
    amount: number,
    notes?: string
  ): Promise<CreatePaymentRequestResult> => {
    const res = await api.post("/payments/debt/pay", { amount, notes });
    return res.data?.data ?? res.data;
  },

  /**
   * Approve a pending payment
   */
  approvePayment: async (paymentId: string, notes?: string) => {
    const res = await api.post(`/payments/debt/${paymentId}/approve`, { notes });
    return res.data?.data ?? res.data;
  },

  /**
   * Reject a pending payment
   */
  rejectPayment: async (paymentId: string, reason: string) => {
    const res = await api.post(`/payments/debt/${paymentId}/reject`, { reason });
    return res.data?.data ?? res.data;
  },

  /**
   * Get list of pending payments (admin/librarian)
   */
  getPendingPayments: async (
    page: number = 1,
    limit: number = 20,
    status?: string
  ) => {
    const params: any = { page, limit };
    if (status) params.status = status;

    const res = await api.get("/payments/debt/pending", { params });
    return res.data?.data ?? res.data;
  },
};
