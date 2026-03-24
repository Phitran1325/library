import { useMemo } from "react";
import { X } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

type Props = {
  open: boolean;
  onClose: () => void;
  paymentAmount: string;
  onChangeAmount: (value: string) => void;
  totalDebt: number;
  paying: boolean;
  onSubmit: () => void;
};

export function PaymentRequestDialog({
  open,
  onClose,
  paymentAmount,
  onChangeAmount,
  totalDebt,
  paying,
  onSubmit,
}: Props) {
  if (!open) return null;

  const numAmount = Number(paymentAmount || 0);
  const hasError =
    !paymentAmount ||
    Number.isNaN(numAmount) ||
    numAmount <= 0 ||
    numAmount > totalDebt;

  const helperText = useMemo(() => {
    if (!paymentAmount)
      return "Nhập số tiền muốn thanh toán (không vượt quá tổng nợ)";
    if (Number.isNaN(numAmount) || numAmount <= 0)
      return "Số tiền phải lớn hơn 0";
    if (numAmount > totalDebt)
      return "Không được vượt quá tổng nợ hiện tại";
    return "Nhập số tiền muốn thanh toán (không vượt quá tổng nợ)";
  }, [paymentAmount, numAmount, totalDebt]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !paying && onClose()}
      />

      {/* MODAL */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-200 animate-scaleIn">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">
              Gửi yêu cầu thanh toán tại quầy
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Tổng nợ hiện tại:{" "}
              <strong className="text-gray-800">
                {formatCurrency(totalDebt)}
              </strong>
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={paying}
            className={`p-1.5 rounded-full hover:bg-gray-100 text-gray-500 ${
              paying ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          Bạn đang tạo{" "}
          <strong className="text-gray-800">
            yêu cầu thanh toán tiền mặt tại quầy
          </strong>
          . Khoản nợ sẽ chỉ được trừ khi bạn thanh toán trực tiếp và thủ thư
          xác nhận giao dịch.
        </p>

        {/* INPUT */}
        <div className="mb-2">
          <label className="font-medium text-sm">
            Số tiền muốn thanh toán
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => onChangeAmount(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg outline-none transition ${
                hasError && paymentAmount
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              min={0}
            />
            <span className="text-gray-500 text-sm">VNĐ</span>
          </div>

          <p
            className={`text-xs mt-1 ${
              hasError ? "text-red-500" : "text-gray-500"
            }`}
          >
            {helperText}
          </p>
        </div>

        {/* LOADING BAR */}
        {paying && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 animate-loadingBar" />
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={paying}
            className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition ${
              paying ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Hủy
          </button>

          <button
            onClick={onSubmit}
            disabled={paying || hasError}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition ${
              paying || hasError
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow"
            }`}
          >
            {paying ? "Đang gửi yêu cầu..." : "Xác nhận yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}
