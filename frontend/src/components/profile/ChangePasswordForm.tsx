import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { notifications } from "@mantine/notifications";
import { changePassword } from "../../services/auth.api";
import { Lock, EyeOff, Eye, Save } from "lucide-react";

type ChangePasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>();

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (data.newPassword !== data.confirmPassword) {
      notifications.show({
        title: "Lỗi",
        message: "Mật khẩu xác nhận không khớp",
        color: "red",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      await changePassword(
        data.oldPassword,
        data.newPassword,
        data.confirmPassword,
        token
      );

      notifications.show({
        title: "Thành công",
        message: "Đổi mật khẩu thành công",
        color: "green",
      });
      reset();
    } catch (error: any) {
      notifications.show({
        title: "Thất bại",
        message: error?.message || "Đổi mật khẩu thất bại",
        color: "red",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 pb-6 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h3>
        <p className="text-gray-500 text-sm mt-1">
          Cập nhật mật khẩu để bảo vệ tài khoản
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        {/* Mật khẩu hiện tại */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Mật khẩu hiện tại
          </label>
          <div className="relative group">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type={showOld ? "text" : "password"}
              {...register("oldPassword", {
                required: "Vui lòng nhập mật khẩu hiện tại",
              })}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all 
                         placeholder:text-gray-400"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.oldPassword && (
            <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
              {errors.oldPassword.message}
            </p>
          )}
        </div>

        {/* Mật khẩu mới */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Mật khẩu mới
          </label>
          <div className="relative group">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type={showNew ? "text" : "password"}
              {...register("newPassword", {
                required: "Vui lòng nhập mật khẩu mới",
                pattern: {
                  value: strongPasswordRegex,
                  message:
                    "Mật khẩu phải ≥ 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt",
                },
              })}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all 
                         placeholder:text-gray-400"
              placeholder="Nhập mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative group">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Vui lòng xác nhận mật khẩu",
              })}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all 
                         placeholder:text-gray-400"
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl 
                       hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 
                       disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Cập nhật mật khẩu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
