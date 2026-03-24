import { AlertTriangle } from "lucide-react";
import type { DebtInfo } from "@/services/debtPayment.api";

type Props = { debtInfo: DebtInfo };

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

export function OverdueBorrowsTable({ debtInfo }: Props) {
  const items = debtInfo.overdueBorrows || [];
  if (!items.length) return null;

  const totalOverdueFee =
    items.reduce((sum, b) => sum + (b.lateFee || 0), 0) || 0;

  return (
    <div className="w-full rounded-xl bg-white shadow border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Sách đang mượn (quá hạn)</h2>
        <p className="text-red-600 font-medium mt-1">
          Tổng phí trễ hạn hiện tại: {formatCurrency(totalOverdueFee)}
        </p>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Sách</th>
              <th className="text-left px-4 py-3 font-semibold">Hạn trả</th>
              <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
              <th className="text-right px-4 py-3 font-semibold">
                Phí trễ hạn hiện tại
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((borrow, idx) => {
              const dueDate = new Date(borrow.dueDate);
              const daysOverdue = Math.floor(
                (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <tr
                  key={borrow._id}
                  className={`border-b transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                  } hover:bg-red-50/60`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {borrow.book?.title || "—"}
                  </td>

                  <td className="px-4 py-3 text-red-600">
                    {formatDate(borrow.dueDate)}
                  </td>

                  <td className="px-4 py-3 text-red-600 font-medium">
                    Quá hạn {daysOverdue} ngày
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {formatCurrency(borrow.lateFee || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BANNER */}
      <div className="px-5 py-3 border-t border-amber-200 bg-amber-50 text-amber-700 text-sm flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <span>
          Vui lòng trả sách sớm để tránh phí phạt tăng thêm. Phí trễ hạn được tính
          theo từng ngày.
        </span>
      </div>
    </div>
  );
}
