import { Wallet, Info, CheckCircle2 } from "lucide-react";
import type { DebtInfo } from "@/services/debtPayment.api";

type Props = {
  debtInfo: DebtInfo;
  onOpenPaymentDialog: () => void;
  hasPending?: boolean;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export function DebtSummaryCard({
  debtInfo,
  onOpenPaymentDialog,
  hasPending = false,
}: Props) {
  const isDebt = debtInfo.totalDebt > 0;

  return (
    <div
      className={`w-full rounded-2xl p-5 shadow-md border bg-white/70 backdrop-blur-md transition-all ${
        isDebt ? "border-red-300 hover:shadow-lg hover:-translate-y-[2px]" : "border-emerald-300"
      }`}
    >
      {/* TOP SECTION */}
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isDebt ? "bg-red-50" : "bg-emerald-50"
          }`}
        >
          <Wallet
            size={34}
            strokeWidth={2.4}
            className={isDebt ? "text-red-500" : "text-emerald-600"}
          />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Tổng nợ hiện tại
          </p>

          <p
            className={`text-3xl font-bold mt-1 ${
              isDebt ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {formatCurrency(debtInfo.totalDebt)}
          </p>

          {isDebt ? (
            <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
              <Info size={16} />
              <span>Vui lòng gửi yêu cầu trước nếu thanh toán tại quầy.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 size={18} />
              <span>Hiện tại bạn không còn công nợ nào với thư viện 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* STATUS OR BUTTON */}
      {isDebt && (
        <>
          {hasPending ? (
            <div className="w-full mt-4 py-3 text-center font-semibold bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              Đã gửi yêu cầu — chờ thư viện duyệt
            </div>
          ) : (
            <button
              onClick={onOpenPaymentDialog}
              className="w-full mt-4 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-md text-base"
            >
              GỬI YÊU CẦU THANH TOÁN
            </button>
          )}
        </>
      )}
    </div>
  );
}
