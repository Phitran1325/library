import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Types
export type MembershipRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface MembershipRequest {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  plan: {
    _id: string;
    name: string;
    price: number;
    duration: number;
    benefits: string[];
  };
  status: MembershipRequestStatus;
  requestDate: string;
  processedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  processedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipRequestsResponse {
  requests: MembershipRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Service
export const librarianMembershipService = {
  /**
   * Get all membership requests
   */
  getMembershipRequests: async (
    page: number = 1,
    limit: number = 20,
    status?: MembershipRequestStatus
  ): Promise<MembershipRequestsResponse> => {
    const params: any = { page, limit };
    if (status) params.status = status;

    const res = await api.get('/librarian/membership-requests', { params });
    return res.data?.data ?? res.data;
  },

  /**
   * Get a single membership request by ID
   */
  getMembershipRequestById: async (id: string): Promise<MembershipRequest> => {
    const res = await api.get(`/librarian/membership-requests/${id}`);
    return res.data?.data?.request ?? res.data?.data;
  },

  /**
   * Approve membership request
   */
  approveMembershipRequest: async (id: string, notes?: string): Promise<MembershipRequest> => {
    const res = await api.post(`/librarian/membership-requests/${id}/approve`, { notes });
    return res.data?.data?.request ?? res.data?.data;
  },

  /**
   * Reject membership request
   */
  rejectMembershipRequest: async (id: string, reason: string, notes?: string): Promise<MembershipRequest> => {
    const res = await api.post(`/librarian/membership-requests/${id}/reject`, { reason, notes });
    return res.data?.data?.request ?? res.data?.data;
  },
};
