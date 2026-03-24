import axios from "axios";
import type { User } from "../types";

// ========== Types ==========
export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse {
  message: string;
}

// ========== Axios instance ==========
const api = axios.create({
  baseURL: "http://localhost:5000/api/auth",
  withCredentials: true,
});

// ========== Auth APIs ==========

// ---- REGISTER ----
export const signup = async (
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>("/register", {
      fullName,
      email,
      password,
      confirmPassword,
    });
    return res.data; // { message: 'User registered successfully. Please verify your email.' }
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Đăng ký thất bại!");
  }
};

// ---- VERIFY EMAIL (với OTP) ----
export const verifyEmail = async (
  email: string,
  otpCode: string
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>("/verify-email", {
      email,
      otpCode,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Xác thực email thất bại!");
  }
};

// ---- RESEND OTP ----
export const resendOTP = async (email: string): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>("/resend-otp", { email });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Gửi lại OTP thất bại!");
  } 
};

// ---- LOGIN ----
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const res = await api.post<LoginResponse>("/login", { email, password });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Đăng nhập thất bại!");
  }
};

// ---- FORGOT PASSWORD (gửi OTP) ----
export const forgotPassword = async (email: string): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>("/forgot-password", { email });
    return res.data;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message || "Không gửi được email đặt lại mật khẩu!"
    );
  }
};

// ---- RESET PASSWORD (với OTP) ----
export const resetPassword = async (
  email: string,
  otpCode: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>("/reset-password", {
      email,
      otpCode,
      newPassword,
      confirmPassword,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(
      err.response?.data?.message || "Đặt lại mật khẩu thất bại!"
    );
  }
};

// ---- CHANGE PASSWORD (yêu cầu token đăng nhập) ----
export const changePassword = async (
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
  token: string
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>(
      "/change-password",
      { oldPassword, newPassword, confirmPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || "Đổi mật khẩu thất bại!");
  }
};