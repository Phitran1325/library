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

export function UnpaidBorrowsTable({ debtInfo }: Props) {
  const items = debtInfo.unpaidBorrows || [];
  if (!items.length) return null;

  const totalUnpaidFee = items.reduce(
    (sum, b) => sum + (b.lateFee || 0) + (b.damageFee || 0),
    0
  );

  return (
    <div className="w-full rounded-xl bg-white shadow border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sách đã trả (chưa thanh toán phí)</h2>
          <p className="text-xs text-gray-500 mt-1">
            Các khoản phí phát sinh nhưng chưa được thanh toán
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Tổng phí chưa thanh toán</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(totalUnpaidFee)}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b text-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-semibold w-[35%]">Sách</th>
              <th className="text-left px-4 py-3 font-semibold">Hạn trả</th>
              <th className="text-left px-4 py-3 font-semibold">Ngày trả</th>
              <th className="text-right px-4 py-3 font-semibold">Phí trễ hạn</th>
              <th className="text-right px-4 py-3 font-semibold">
                Phí hư hỏng / mất
              </th>
              <th className="text-right px-4 py-3 font-semibold">Tổng phí</th>
            </tr>
          </thead>

          <tbody>
            {items.map((borrow, idx) => {
              const late = borrow.lateFee || 0;
              const damage = borrow.damageFee || 0;
              const fee = late + damage;

              return (
                <tr
                  key={borrow._id}
                  className={`border-b transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                  } hover:bg-gray-50`}
                >
                  <td className="px-4 py-3 max-w-xs truncate font-medium text-gray-800">
                    {borrow.book?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatDate(borrow.dueDate)}</td>
                  <td className="px-4 py-3">{formatDate(borrow.returnDate)}</td>

                  <td className="px-4 py-3 text-right">
                    <span className={late ? "text-red-600 font-medium" : "text-gray-700"}>
                      {formatCurrency(late)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span
                      className={damage ? "text-red-600 font-medium" : "text-gray-700"}
                    >
                      {formatCurrency(damage)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-red-600">
                      {formatCurrency(fee)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* TOTAL ROW */}
            <tr className="bg-gray-100">
              <td className="px-4 py-3 font-bold" colSpan={5}>
                Tổng cộng
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-extrabold text-red-600">
                  {formatCurrency(totalUnpaidFee)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
