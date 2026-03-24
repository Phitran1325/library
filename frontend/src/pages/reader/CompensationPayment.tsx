import { useEffect, useState, useCallback } from "react";
import { LayoutDashboard, BookOpen, History } from "lucide-react";
import type { AxiosError } from "axios";

import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/components/common/Notification";

import {
  debtPaymentService,
  type DebtInfo,
  type DebtPaymentHistoryItem,
} from "@/services/debtPayment.api";

import { DebtSummaryCard } from "@/components/DebtPayment/DebtSummaryCard";
import { UnpaidBorrowsTable } from "@/components/DebtPayment/UnpaidBorrowsTable";
import { OverdueBorrowsTable } from "@/components/DebtPayment/OverdueBorrowsTable";
import { PaymentHistoryTable } from "@/components/DebtPayment/PaymentHistoryTable";
import { PaymentRequestDialog } from "@/components/DebtPayment/PaymentRequestDialog";

type NavSection = "overview" | "books" | "history";

export default function CompensationPayment() {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const [debtInfo, setDebtInfo] = useState<DebtInfo | null>(null);
  const [history, setHistory] = useState<DebtPaymentHistoryItem[]>([]);

  const [loadingDebt, setLoadingDebt] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorDebt, setErrorDebt] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const [current, setCurrent] = useState<NavSection>("overview");

  /* ================= LOAD DATA ================= */
  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingDebt(true);
      setLoadingHistory(true);
      setErrorDebt(null);

      const [debtData, historyData] = await Promise.all([
        debtPaymentService.getDebtInfo(),
        debtPaymentService.getHistory(),
      ]);

      setDebtInfo(debtData ?? null);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (e) {
      const msg =
        (e as AxiosError<{ message?: string }>).response?.data?.message ??
        "Không thể tải dữ liệu";
      setErrorDebt(msg);
      showNotification(msg, "error");
    } finally {
      setLoadingDebt(false);
      setLoadingHistory(false);
    }
  }, [token, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasPending = history.some((h) => h.status === "Pending");

  /* ================= PAYMENT ACTION ================= */
  const submitPayment = async () => {
    if (!amount || Number(amount) <= 0) {
      showNotification("Vui lòng nhập số tiền hợp lệ", "warning");
      return;
    }

    setPaying(true);
    try {
      await debtPaymentService.createPaymentRequest(
        Number(amount),
        "Thanh toán bồi thường"
      );

      showNotification("Yêu cầu đã được gửi. Chờ thư viện xác nhận.", "success");
      await loadData();
      setOpenDialog(false);
      setAmount("");
    } catch {
      showNotification("Không thể gửi yêu cầu", "error");
    } finally {
      setPaying(false);
    }
  };

  /* ================= CONTENT ================= */
  const renderContent = () => {
    if (loadingDebt) {
      return (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-3">Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (errorDebt) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <div className="flex justify-between items-center gap-3">
            <span>{errorDebt}</span>
            <button
              onClick={loadData}
              className="px-3 py-1 rounded-md text-sm bg-red-500 text-white hover:bg-red-600 transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    if (!debtInfo) {
      return (
        <div className="bg-blue-50 text-blue-600 p-4 rounded-lg border border-blue-100">
          Không có dữ liệu công nợ
        </div>
      );
    }

    return (
      <>
        {current === "overview" && (
          <DebtSummaryCard
            debtInfo={debtInfo}
            hasPending={hasPending}
            onOpenPaymentDialog={() => {
              setAmount(debtInfo.totalDebt?.toString() ?? "");
              setOpenDialog(true);
            }}
          />
        )}

        {current === "books" && (
          <>
            <UnpaidBorrowsTable debtInfo={debtInfo} />
            <div className="mt-4">
              <OverdueBorrowsTable debtInfo={debtInfo} />
            </div>
          </>
        )}

        {current === "history" && (
          <PaymentHistoryTable
            history={history}
            loading={loadingHistory}
            onRefresh={loadData}
          />
        )}
      </>
    );
  };

  /* ================= RETURN UI ================= */
  return (
    <div className="min-h-[calc(100vh-70px)] py-6 bg-gradient-to-b from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-5 p-5 rounded-xl shadow-lg border border-white/50 bg-white/70 backdrop-blur-lg">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📑 Thanh toán & Công nợ thư viện
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý số dư – xem sách chưa thanh toán – gửi yêu cầu trực tiếp
          </p>
        </div>

        {/* NAVIGATION */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {[
            { key: "overview", label: "Tổng quan", icon: <LayoutDashboard size={18} /> },
            { key: "books", label: "Danh sách sách", icon: <BookOpen size={18} /> },
            {
              key: "history",
              label: `Lịch sử${loadingHistory ? "..." : ""}`,
              icon: <History size={18} />,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrent(tab.key as NavSection)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${
                current === tab.key
                  ? "bg-white border-blue-500 shadow-md"
                  : "bg-white/50 border-gray-300 hover:bg-white/70"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="p-5 rounded-xl shadow-lg border border-white/50 bg-white/80 backdrop-blur-md">
          {hasPending && (
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg mb-4 font-medium border border-blue-100">
              🔄 Có yêu cầu thanh toán đang chờ thư viện duyệt
            </div>
          )}
          {renderContent()}
        </div>

        {/* PAYMENT POPUP */}
        <PaymentRequestDialog
          open={openDialog}
          onClose={() => {
            if (!paying) {
              setOpenDialog(false);
              setAmount("");
            }
          }}
          paymentAmount={amount}
          onChangeAmount={(v) => /^\d*$/.test(v) && setAmount(v)}
          totalDebt={debtInfo?.totalDebt ?? 0}
          paying={paying}
          onSubmit={submitPayment}
        />
      </div>
    </div>
  );
}
