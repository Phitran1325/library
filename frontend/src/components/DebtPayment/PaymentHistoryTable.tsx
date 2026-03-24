import type { DebtPaymentHistoryItem } from "@/services/debtPayment.api";

type Props = {
  history: DebtPaymentHistoryItem[];
  loading: boolean;
  onRefresh?: () => Promise<void>;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
};

export function PaymentHistoryTable({ history, loading, onRefresh }: Props) {
  return (
    <div className="mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Lịch sử yêu cầu thanh toán</h2>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-100 transition"
          >
            Làm mới
          </button>
        )}
      </div>

      {/* CARD CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent animate-spin rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-4 text-gray-500">
            Chưa có yêu cầu thanh toán nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Thời gian</th>
                  <th className="text-right px-4 py-3 font-semibold">Số tiền</th>
                  <th className="text-left px-4 py-3 font-semibold">Hình thức</th>
                  <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => {
                  const badge =
                    item.status === "Approved"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : item.status === "Rejected"
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-yellow-100 text-yellow-700 border-yellow-300";

                  const label =
                    item.status === "Approved"
                      ? "Đã chấp nhận"
                      : item.status === "Rejected"
                      ? "Đã từ chối"
                      : "Đang chờ xử lý";

                  return (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3">{formatDate(item.createdAt)}</td>

                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="px-4 py-3">
                        {item.method === "Manual"
                          ? "Thanh toán tại quầy"
                          : item.method}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 text-xs rounded-md font-semibold border ${badge}`}
                        >
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
