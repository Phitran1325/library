import { Request, Response, NextFunction } from 'express';
import { BOOK_CONDITION } from '../utils/borrowingConstants';

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Profile update validation
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { fullName, phoneNumber, address } = req.body;
  
  // Check if at least one field is provided
  if (!fullName && !phoneNumber && !address) {
    return res.status(400).json({ message: 'At least one field must be provided' });
  }

  // Validate full name if provided
  if (fullName && fullName.trim().length < 2) {
    return res.status(400).json({ message: 'Full name must be at least 2 characters' });
  }

  // Validate phone number if provided
  if (phoneNumber && !/^[0-9+\-\s()]{10,15}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  next();
};

// Individual validation functions
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || fullName.trim().length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters' };
  }
  return { isValid: true };
};

export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  if (!phoneNumber) {
    return { isValid: true }; // Phone number is optional
  }
  
  if (!/^[0-9+\-\s()]{10,15}$/.test(phoneNumber)) {
    return { isValid: false, message: 'Invalid phone number format' };
  }
  
  return { isValid: true };
};

export const validateAddress = (address: string): ValidationResult => {
  if (!address) {
    return { isValid: true }; // Address is optional
  }
  
  if (address.trim().length < 5) {
    return { isValid: false, message: 'Address must be at least 5 characters' };
  }
  
  return { isValid: true };
};

// Combined validation for profile update
export const validateProfileUpdateFields = (fullName?: string, phoneNumber?: string, address?: string): ValidationResult => {
  // Check if at least one field is provided
  if (!fullName && !phoneNumber && !address) {
    return { isValid: false, message: 'At least one field must be provided' };
  }

  // Validate each field if provided
  const fullNameValidation = fullName ? validateFullName(fullName) : { isValid: true };
  if (!fullNameValidation.isValid) {
    return fullNameValidation;
  }

  const phoneValidation = phoneNumber ? validatePhoneNumber(phoneNumber) : { isValid: true };
  if (!phoneValidation.isValid) {
    return phoneValidation;
  }

  const addressValidation = address ? validateAddress(address) : { isValid: true };
  if (!addressValidation.isValid) {
    return addressValidation;
  }

  return { isValid: true };
};

// Borrow validation
export const validateBorrowRequest = (req: Request, res: Response, next: NextFunction) => {
  const { bookId } = req.body;

  if (!bookId) {
    return res.status(400).json({ 
      success: false,
      message: 'Vui lòng cung cấp ID sách (bookId)' 
    });
  }

  // Kiểm tra nếu là object (có thể do frontend gửi nhầm)
  if (typeof bookId === 'object' && bookId !== null) {
    return res.status(400).json({ 
      success: false,
      message: 'ID sách không hợp lệ: vui lòng chỉ gửi ID (string), không gửi toàn bộ object. Nếu là object, hãy gửi bookId._id hoặc bookId.id' 
    });
  }

  // Kiểm tra bookId phải là string
  if (typeof bookId !== 'string' || bookId.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'ID sách không hợp lệ: phải là chuỗi' 
    });
  }

  // Kiểm tra nếu string chứa object representation (có thể do JSON.stringify)
  if (bookId.startsWith('{') || bookId.includes('_id:') || bookId.includes('ObjectId(')) {
    return res.status(400).json({ 
      success: false,
      message: 'ID sách không hợp lệ: vui lòng chỉ gửi ID (string), không gửi toàn bộ object. Nếu là object, hãy gửi bookId._id hoặc bookId.id' 
    });
  }

  // Kiểm tra ObjectId format (24 ký tự hex)
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ 
      success: false,
      message: 'ID sách không hợp lệ: format không đúng (phải là ObjectId hợp lệ)' 
    });
  }

  next();
};

// Return book validation
export const validateReturnRequest = (req: Request, res: Response, next: NextFunction) => {
  const { bookCondition, notes } = req.body;
  
  // Debug logging
  console.log('validateReturnRequest:', {
    bookCondition,
    notes,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {})
  });

  // bookCondition là optional, nhưng nếu có thì phải hợp lệ
  const validConditions = Object.values(BOOK_CONDITION);
  if (bookCondition !== undefined && bookCondition !== null && bookCondition !== '') {
    if (!validConditions.includes(bookCondition)) {
      return res.status(400).json({ 
        success: false,
        message: `Tình trạng sách không hợp lệ. Giá trị hợp lệ: ${validConditions.join(', ')}. Nhận được: "${bookCondition}"` 
      });
    }
  }

  // notes là optional, nhưng nếu có thì phải là string và không được quá 500 ký tự
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Ghi chú phải là chuỗi ký tự' 
      });
    }
    if (notes.length > 500) {
      return res.status(400).json({ 
        success: false,
        message: 'Ghi chú không được vượt quá 500 ký tự' 
      });
    }
  }

  next();
};

// Review validation
export const validateReviewRequest = (req: Request, res: Response, next: NextFunction) => {
  const { rating, comment, bookId } = req.body;

  // rating: required cho tạo mới, optional cho cập nhật
  if (rating !== undefined) {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải là số từ 1 đến 5'
      });
    }
  }

  if (comment !== undefined) {
    if (typeof comment !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Bình luận phải là chuỗi ký tự'
      });
    }
    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Bình luận không được vượt quá 1000 ký tự'
      });
    }
  }

  if (bookId !== undefined) {
    if (typeof bookId !== 'string' || bookId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ'
      });
    }
  }

  next();
};

export const validateEbookReportSubmission = (req: Request, res: Response, next: NextFunction) => {
  const mongoose = require('mongoose');
  const { bookId, digitalFileId, issueType, description, pageNumber, evidenceUrls } = req.body;

  if (!bookId || typeof bookId !== 'string' || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({
      success: false,
      message: 'bookId không hợp lệ',
    });
  }

  if (digitalFileId) {
    if (typeof digitalFileId !== 'string' || !mongoose.Types.ObjectId.isValid(digitalFileId)) {
      return res.status(400).json({
        success: false,
        message: 'digitalFileId không hợp lệ',
      });
    }
  }

  const validIssues = [
    'copyright',
    'formatting',
    'broken_link',
    'typo',
    'offensive',
    'other',
  ];

  if (!issueType || typeof issueType !== 'string' || !validIssues.includes(issueType)) {
    return res.status(400).json({
      success: false,
      message: 'issueType không hợp lệ',
    });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    return res.status(400).json({
      success: false,
      message: 'description phải có ít nhất 20 ký tự',
    });
  }

  if (description.trim().length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'description không được vượt quá 2000 ký tự',
    });
  }

  if (pageNumber !== undefined) {
    if (
      typeof pageNumber !== 'number' ||
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: 'pageNumber không hợp lệ',
      });
    }
  }

  if (evidenceUrls !== undefined) {
    if (!Array.isArray(evidenceUrls)) {
      return res.status(400).json({
        success: false,
        message: 'evidenceUrls phải là mảng',
      });
    }
    const urlRegex = /^https?:\/\/.{3,}$/i;
    for (const url of evidenceUrls) {
      if (typeof url !== 'string' || url.trim().length === 0 || url.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi evidenceUrl phải là chuỗi <= 500 ký tự',
        });
      }
      if (!urlRegex.test(url.trim())) {
        return res.status(400).json({
          success: false,
          message: 'evidenceUrl phải là đường dẫn hợp lệ bắt đầu bằng http/https',
        });
      }
    }
  }

  next();
};

export const validateEbookReportUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { status, resolutionNotes } = req.body;
  const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái báo cáo không hợp lệ',
    });
  }

  if (resolutionNotes !== undefined) {
    if (typeof resolutionNotes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'resolutionNotes phải là chuỗi',
      });
    }
    if (resolutionNotes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'resolutionNotes không được vượt quá 2000 ký tự',
      });
    }
  }

  next();
};
