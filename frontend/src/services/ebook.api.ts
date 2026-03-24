// src/services/ebook.api.ts
import axios from "axios";

/* ============================
   1. Axios instance (gộp từ api.ts)
============================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token tự động
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


/* ============================
   2. Ebook types
============================= */

export interface DigitalFile {
  _id: string;
  format: string;
  url: string;
  size?: number;
  uploadedAt?: string;
}

export type EbookReportIssueType =
  | "copyright"
  | "formatting"
  | "broken_link"
  | "typo"
  | "offensive"
  | "other";

export interface SubmitEbookReportPayload {
  bookId: string;
  digitalFileId?: string;
  issueType: EbookReportIssueType;
  description: string;
  pageNumber?: number;
  evidenceUrls?: string[];
}

export interface EbookContentReport {
  _id: string;
  book: {
    _id: string;
    title: string;
    coverImage?: string;
  };
  reporter: {
    _id: string;
    fullName: string;
    email: string;
  };
  handledBy?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  issueType: EbookReportIssueType;
  description: string;
  pageNumber?: number;
  evidenceUrls?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EbookReportListResponse {
  items: EbookContentReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ============================
   3. Lấy URL ebook từ digitalFiles
============================= */

export const getEbookDownloadUrl = async (bookId: string): Promise<string> => {
  const res = await api.get(`/books/${bookId}`);

  // backend của bạn: { data: { book: {...} } }
  const book = res.data?.data?.book ?? res.data?.data ?? res.data;

  const digitalFiles: DigitalFile[] = book?.digitalFiles || [];

  if (!Array.isArray(digitalFiles) || digitalFiles.length === 0) {
    throw new Error("Sách này chưa có bản điện tử.");
  }

  // lấy file mới nhất
  const latestFile = digitalFiles[digitalFiles.length - 1];

  if (!latestFile.url) {
    throw new Error("Không tìm thấy URL của file ebook.");
  }

  return latestFile.url;
};

/* ============================
   4. Gửi báo cáo nội dung ebook
============================= */

export const submitEbookReport = async (payload: SubmitEbookReportPayload) => {
  const response = await api.post("/ebook-content-reports", payload);
  return response.data;
};

/* ============================
   5. Lấy danh sách báo cáo ebook
============================= */

export const getMyEbookReports = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<EbookReportListResponse> => {
  const response = await api.get("/ebook-content-reports/me", {
    params,
  });
  return response.data.data;
};

export const getAllEbookReports = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  issueType?: EbookReportIssueType;
  bookId?: string;
  reporterId?: string;
  search?: string;
}): Promise<EbookReportListResponse> => {
  const response = await api.get("/ebook-content-reports", {
    params,
  });
  return response.data.data;
};

/* ============================
   6. Lấy chi tiết báo cáo
============================ */

export const getEbookReportById = async (id: string): Promise<EbookContentReport> => {
  const response = await api.get(`/ebook-content-reports/${id}`);
  return response.data.data;
};

/* ============================
   7. Cập nhật trạng thái báo cáo
============================ */

export type EbookReportStatus = "PENDING" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

export interface UpdateEbookReportPayload {
  status?: EbookReportStatus;
  resolutionNotes?: string;
}

export const updateEbookReport = async (
  id: string,
  payload: UpdateEbookReportPayload
): Promise<EbookContentReport> => {
  const response = await api.patch(`/ebook-content-reports/${id}`, payload);
  return response.data.data;
};

