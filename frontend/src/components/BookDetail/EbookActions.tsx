import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Download, Flag } from "lucide-react";
import type { Book } from "../../types";
import { membershipService } from "../../services/book.service";
import {
  getEbookDownloadUrl,
  submitEbookReport,
  type EbookReportIssueType,
} from "../../services/ebook.api";
import { useNotification } from "../common/Notification";

interface EbookActionsProps {
  book: Book;
}

export const EbookActions = ({ book }: EbookActionsProps) => {
  const bookId = (book as any)._id || (book as any).id;
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [checkingMembership, setCheckingMembership] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [readLoading, setReadLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // ==== STATE REPORT ====
  const [reportOpen, setReportOpen] = useState(false);
  const [reportIssueType, setReportIssueType] =
    useState<EbookReportIssueType>("other");
  const [reportDescription, setReportDescription] = useState("");
  const [reportPageNumber, setReportPageNumber] = useState<string>("");
  const [reportEvidenceUrls, setReportEvidenceUrls] = useState<string>("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Check gói thành viên khi load component (phục vụ đọc / tải)
  useEffect(() => {
    const checkMembership = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setHasMembership(false);
          return;
        }

        const status = await membershipService.checkStatus();
        setHasMembership(status.hasMembership);
      } catch (err) {
        console.error("Lỗi khi kiểm tra gói thành viên:", err);
        setActionError("Không thể kiểm tra trạng thái gói thành viên.");
      } finally {
        setCheckingMembership(false);
      }
    };

    checkMembership();
  }, []);

  // ===========================
  // Đọc sách online
  // ===========================
  const handleReadEbook = () => {
    if (!bookId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setActionError("Vui lòng đăng nhập để đọc ebook.");
      return;
    }

    if (!hasMembership) {
      setActionError("Bạn cần đăng ký gói thành viên để đọc ebook.");
      return;
    }

    setActionError(null);
    setReadLoading(true);

    navigate(`/reader/${bookId}`, {
      state: {
        title: book.title,
      },
    });

    setReadLoading(false);
  };

  // ===========================
  // Tải ebook về máy
  // ===========================
  const handleDownloadEbook = async () => {
    if (!bookId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setActionError("Vui lòng đăng nhập để tải ebook.");
      return;
    }

    if (!hasMembership) {
      setActionError("Bạn cần đăng ký gói thành viên để tải ebook.");
      return;
    }

    setDownloadLoading(true);
    setActionError(null);

    try {
      const url = await getEbookDownloadUrl(bookId);

      const safeBookName = book.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `sach-${safeBookName}.pdf`;
      a.click();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Lỗi khi tải ebook:", err);
      setActionError("Không thể tải ebook. Vui lòng thử lại sau.");
    } finally {
      setDownloadLoading(false);
    }
  };

  // ===========================
  // REPORT: mở popup
  // ===========================
  const handleOpenReport = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setActionError("Vui lòng đăng nhập để báo cáo ebook.");
      return;
    }

    setActionError(null);
    setReportError(null);
    setReportOpen(true);
  };

  // ===========================
  // REPORT: validate form phía FE
  // Để khớp với rule backend submitEbookContentReport
  // ===========================
  const validateReportForm = (): string | null => {
    if (!reportDescription || reportDescription.trim().length < 20) {
      return "Nội dung báo cáo phải có ít nhất 20 ký tự.";
    }
    if (reportDescription.trim().length > 2000) {
      return "Nội dung báo cáo không được vượt quá 2000 ký tự.";
    }

    if (reportPageNumber.trim().length > 0) {
      const num = Number(reportPageNumber.trim());
      if (!Number.isInteger(num) || num < 1 || num > 10000) {
        return "Số trang không hợp lệ (1 – 10000).";
      }
    }

    if (reportEvidenceUrls.trim().length > 0) {
      const pieces = reportEvidenceUrls
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      if (pieces.length > 5) {
        return "Tối đa 5 đường dẫn minh chứng.";
      }

      const urlRegex = /^https?:\/\/.{3,}$/i;
      for (const u of pieces) {
        if (u.length > 500) {
          return "Mỗi URL minh chứng không được vượt quá 500 ký tự.";
        }
        if (!urlRegex.test(u)) {
          return "Có URL minh chứng không hợp lệ. Hãy dùng dạng http(s)://...";
        }
      }
    }

    return null;
  };

  // ===========================
  // REPORT: submit
  // ===========================
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookId) {
      const message = "Không xác định được ID sách để báo cáo.";
      console.error(message, { book });
      setReportError(message);
      showNotification(message, "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setReportError("Vui lòng đăng nhập để báo cáo ebook.");
      return;
    }

    // FE validate trước, tránh gọi API sai format
    const formError = validateReportForm();
    if (formError) {
      setReportError(formError);
      showNotification(formError, "error");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);

    try {
      const pageNumber =
        reportPageNumber.trim().length > 0
          ? parseInt(reportPageNumber.trim(), 10)
          : undefined;

      const evidenceUrls =
        reportEvidenceUrls.trim().length > 0
          ? reportEvidenceUrls
              .split(",")
              .map((u) => u.trim())
              .filter((u) => u.length > 0)
          : undefined;

      await submitEbookReport({
        bookId,
        issueType: reportIssueType,
        description: reportDescription.trim(),
        pageNumber,
        evidenceUrls,
      });

      showNotification("Đã gửi báo cáo ebook. Cảm ơn bạn!", "success");

      // reset form
      setReportOpen(false);
      setReportDescription("");
      setReportPageNumber("");
      setReportEvidenceUrls("");
      setReportIssueType("other");
    } catch (err: any) {
      console.error("Lỗi khi gửi báo cáo ebook:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể gửi báo cáo. Vui lòng thử lại sau.";
      setReportError(message);
      showNotification(message, "error");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="pt-4 space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleReadEbook}
          disabled={readLoading || checkingMembership}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-blue-600 border border-blue-500 hover:bg-blue-50 disabled:opacity-60"
        >
          {readLoading ? (
            "Đang mở..."
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Đọc sách online
            </>
          )}
        </button>

        <button
          onClick={handleDownloadEbook}
          disabled={downloadLoading || checkingMembership}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          {downloadLoading ? (
            "Đang tải..."
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Tải ebook về máy
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleOpenReport}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-500 hover:bg-red-50 transition"
        >
          <Flag className="w-4 h-4 mr-2" />
          Report ebook
        </button>
      </div>

      {checkingMembership && (
        <p className="text-xs text-text-light">
          Đang kiểm tra trạng thái gói thành viên...
        </p>
      )}

      {!checkingMembership && !localStorage.getItem("token") && (
        <p className="text-xs text-yellow-700">
          Vui lòng đăng nhập để sử dụng chức năng đọc / tải ebook.
        </p>
      )}

      {actionError && (
        <p className="text-xs text-red-600 mt-1">{actionError}</p>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">
              Báo cáo nội dung ebook
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Vui lòng mô tả chi tiết vấn đề để thư viện có thể xử lý nhanh
              hơn.
            </p>

            {reportError && (
              <p className="mb-2 text-xs text-red-600">{reportError}</p>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Loại vấn đề
                </label>
                <select
                  value={reportIssueType}
                  onChange={(e) =>
                    setReportIssueType(e.target.value as EbookReportIssueType)
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={reportSubmitting}
                >
                  <option value="copyright">Bản quyền</option>
                  <option value="formatting">Lỗi định dạng / hiển thị</option>
                  <option value="broken_link">Link hỏng / không mở được</option>
                  <option value="typo">Lỗi chính tả / nội dung sai</option>
                  <option value="offensive">
                    Nội dung phản cảm / không phù hợp
                  </option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Trang (nếu có)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={reportPageNumber}
                  onChange={(e) => setReportPageNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={reportSubmitting}
                  placeholder="VD: 12"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Đường dẫn minh chứng (tùy chọn)
                </label>
                <input
                  type="text"
                  value={reportEvidenceUrls}
                  onChange={(e) => setReportEvidenceUrls(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={reportSubmitting}
                  placeholder="Nhập các URL, cách nhau bởi dấu phẩy"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Tối đa 5 URL, dạng http(s)://...
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nội dung báo cáo
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  disabled={reportSubmitting}
                  placeholder="Mô tả chi tiết lỗi, vị trí, ví dụ minh họa..."
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Tối thiểu 20 ký tự.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!reportSubmitting) {
                      setReportOpen(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={reportSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {reportSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
