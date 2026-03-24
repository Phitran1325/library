import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { User, Phone, MapPin, Save, Pencil } from "lucide-react";

type PersonalInfoFormProps = {
  user: any;
  updateProfile: (data: {
    fullName: string;
    phoneNumber?: string;
    address?: string;
  }) => Promise<any> | void;
  isUpdating: boolean;
};

type FormValues = {
  fullName: string;
  phoneNumber: string;
  address: string;
};

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  user,
  updateProfile,
  isUpdating,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  // Khi user thay đổi (lần đầu load / sau khi update), đồng bộ lại vào form
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!isEditing) return;
    try {
      await updateProfile(data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const baseInput =
    "w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all duration-200";
  const editableInput =
    "border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm";
  const readOnlyInput =
    "border-transparent bg-gray-50 text-gray-500 cursor-not-allowed";

  const handleToggleEdit = () => {
    if (isEditing) {
      // đang chỉnh → bấm "Hủy bỏ" → reset về dữ liệu user
      reset({
        fullName: user?.fullName || "",
        phoneNumber: user?.phoneNumber || "",
        address: user?.address || "",
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h3>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý thông tin hồ sơ của bạn
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleEdit}
          className={`inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
            isEditing
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          }`}
        >
          <Pencil size={16} />
          <span>{isEditing ? "Hủy bỏ" : "Chỉnh sửa"}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Họ và tên */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">
              Họ và tên
            </label>
            <div className="relative group">
              <User
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  isEditing ? "text-indigo-500" : "text-gray-400"
                }`}
                size={18}
              />
              <input
                {...register("fullName", {
                  required: "Vui lòng nhập họ tên",
                })}
                readOnly={!isEditing}
                className={`${baseInput} ${
                  isEditing ? editableInput : readOnlyInput
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">
              Số điện thoại
            </label>
            <div className="relative group">
              <Phone
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  isEditing ? "text-indigo-500" : "text-gray-400"
                }`}
                size={18}
              />
              <input
                {...register("phoneNumber")}
                readOnly={!isEditing}
                className={`${baseInput} ${
                  isEditing ? editableInput : readOnlyInput
                }`}
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">
              Địa chỉ
            </label>
            <div className="relative group">
              <MapPin
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  isEditing ? "text-indigo-500" : "text-gray-400"
                }`}
                size={18}
              />
              <input
                {...register("address")}
                readOnly={!isEditing}
                className={`${baseInput} ${
                  isEditing ? editableInput : readOnlyInput
                }`}
              />
            </div>
          </div>
        </div>

        {/* Button */}
        {isEditing && (
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
                         font-bold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 
                         transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isUpdating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PersonalInfoForm;
