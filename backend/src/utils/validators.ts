export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): boolean => {
  // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return re.test(password);
};

export const validateOTP = (otp: string): boolean => {
  // 6-digit numeric OTP
  const re = /^\d{6}$/;
  return re.test(otp);
};

export const validateFullName = (fullName: string): boolean => {
  // 3-30 characters, letters and spaces only
  const re = /^[a-zA-ZÀ-ỹ\s]{3,30}$/;
  return re.test(fullName);
};