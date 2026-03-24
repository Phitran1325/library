import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import Book from '../models/Book';
import Author from '../models/Author';
import Publisher from '../models/Publisher';
import Tag from '../models/Tag';
import { uploadCoverImageBuffer } from '../services/uploadService';

interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

interface CreateBookBody {
  title: string;
  language: string;
  category: string;
  rentalPrice: number;
  authorId: string;
  publisherId: string;
  isbn?: string;
  description?: string;
  coverImage?: string;
  pages?: number;
  publicationYear?: number;
  publishedDate?: Date;
  stock?: number;
  volume?: number;
  isNewRelease?: boolean;
  tags?: string[];
}

export const createBookForLibrarian = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      language,
      category,
      rentalPrice,
      authorId,
      publisherId,
      isbn,
      description,
      coverImage,
      pages,
      publicationYear,
      publishedDate,
      stock = 0,
      volume,
      isNewRelease = false,
      tags = []
    } = req.body as CreateBookBody;

    // 1. Validate required fields
    if (!title || !language || !category || rentalPrice === undefined || !authorId || !publisherId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, language, category, rentalPrice, authorId, publisherId'
      });
    }

    // 2. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ success: false, message: 'authorId không hợp lệ' });
    }
    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
      return res.status(400).json({ success: false, message: 'publisherId không hợp lệ' });
    }

    // 3. Validate author exists
    const author = await Author.findOne({ _id: authorId, isActive: true });
    if (!author) {
      return res.status(400).json({ success: false, message: 'Tác giả không tồn tại hoặc đã bị vô hiệu hóa' });
    }

    // 4. Validate publisher exists
    const publisher = await Publisher.findOne({ _id: publisherId, isActive: true });
    if (!publisher) {
      return res.status(400).json({ success: false, message: 'Nhà xuất bản không tồn tại hoặc đã bị vô hiệu hóa' });
    }

    // 5. Validate category
    const allowedCategories = [
      'Văn học',
      'Khoa học - Công nghệ',
      'Lịch sử - Địa lý',
      'Kinh tế - Kinh doanh',
      'Giáo dục - Đào tạo',
      'Y học - Sức khỏe',
      'Nghệ thuật - Thẩm mỹ',
      'Tôn giáo - Triết học',
      'Thiếu nhi - Thanh thiếu niên',
      'Thể thao - Giải trí'
    ];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không hợp lệ. Chỉ cho phép: ' + allowedCategories.join(', ')
      });
    }

    // 6. Validate tags exist
    if (tags.length > 0) {
      const validTags = await Tag.find({ name: { $in: tags }, isActive: true });
      if (validTags.length !== tags.length) {
        const invalidTags = tags.filter(tag => !validTags.find(vt => vt.name === tag));
        return res.status(400).json({
          success: false,
          message: `Các tag sau không tồn tại hoặc đã bị vô hiệu hóa: ${invalidTags.join(', ')}`
        });
      }
    }

    // 7. Check ISBN duplicate
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({ success: false, message: 'Sách với ISBN này đã tồn tại' });
      }
    }

    // 8. Handle cover image upload (if file is provided)
    let finalCoverImage = coverImage;

    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadCoverImageBuffer(req.file.buffer, {
          fileName: req.file.originalname?.split('.').slice(0, -1).join('.') || undefined,
        });
        finalCoverImage = uploadResult.url;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Không thể upload ảnh bìa, vui lòng thử lại sau',
        });
      }
    }

    // 9. Create book
    const book = new Book({
      title,
      language,
      category,
      rentalPrice,
      authorId,
      publisherId,
      isbn,
      description,
      coverImage: finalCoverImage,
      pages,
      publicationYear,
      publishedDate,
      stock,
      available: stock,
      volume,
      isNewRelease,
      tags
    });

    await book.save();

    // 10. Populate author and publisher safely
    await book.populate('authorId', 'name nationality').catch(() => null);
    await book.populate('publisherId', 'name').catch(() => null);

    res.status(201).json({
      success: true,
      message: 'Tạo sách thành công',
      data: { book }
    });

  } catch (error) {
    return handleLibrarianBookError(error, res, 'tạo');
  }
};

export const updateBookForLibrarian = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      language,
      category,
      rentalPrice,
      authorId,
      publisherId,
      isbn,
      description,
      coverImage,
      pages,
      publicationYear,
      publishedDate,
      stock,
      volume,
      isNewRelease = false,
      tags = []
    } = req.body as CreateBookBody;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID sách là bắt buộc' });
    }

    if (!title || !language || !category || rentalPrice === undefined || !authorId || !publisherId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, language, category, rentalPrice, authorId, publisherId'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ success: false, message: 'authorId không hợp lệ' });
    }
    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
      return res.status(400).json({ success: false, message: 'publisherId không hợp lệ' });
    }

    // Find book by ID or slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ slug: id });
    }
    if (!book) {
      return res.status(404).json({ success: false, message: 'Sách không tồn tại' });
    }

    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn, _id: { $ne: id } });
      if (existingBook) {
        return res.status(400).json({ success: false, message: 'Sách với ISBN này đã tồn tại' });
      }
    }

    const allowedCategories = [
      'Văn học',
      'Khoa học - Công nghệ',
      'Lịch sử - Địa lý',
      'Kinh tế - Kinh doanh',
      'Giáo dục - Đào tạo',
      'Y học - Sức khỏe',
      'Nghệ thuật - Thẩm mỹ',
      'Tôn giáo - Triết học',
      'Thiếu nhi - Thanh thiếu niên',
      'Thể thao - Giải trí'
    ];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không hợp lệ. Chỉ cho phép: ' + allowedCategories.join(', ')
      });
    }

    const author = await Author.findOne({ _id: authorId, isActive: true });
    if (!author) {
      return res.status(400).json({ success: false, message: 'Tác giả không tồn tại hoặc đã bị vô hiệu hóa' });
    }

    const publisher = await Publisher.findOne({ _id: publisherId, isActive: true });
    if (!publisher) {
      return res.status(400).json({ success: false, message: 'Nhà xuất bản không tồn tại hoặc đã bị vô hiệu hóa' });
    }

    if (tags.length > 0) {
      const validTags = await Tag.find({ name: { $in: tags }, isActive: true });
      if (validTags.length !== tags.length) {
        const invalidTags = tags.filter(tag => !validTags.find(vt => vt.name === tag));
        return res.status(400).json({
          success: false,
          message: `Các tag sau không tồn tại hoặc đã bị vô hiệu hóa: ${invalidTags.join(', ')}`
        });
      }
    }

    // Handle cover image upload (if new file is provided)
    let finalCoverImage = coverImage;

    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadCoverImageBuffer(req.file.buffer, {
          fileName: req.file.originalname?.split('.').slice(0, -1).join('.') || undefined,
        });
        finalCoverImage = uploadResult.url;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Không thể upload ảnh bìa, vui lòng thử lại sau',
        });
      }
    }

    book.title = title;
    book.language = language;
    book.category = category;
    book.rentalPrice = rentalPrice;
    book.authorId = new mongoose.Types.ObjectId(authorId);
    book.publisherId = new mongoose.Types.ObjectId(publisherId);
    book.isNewRelease = !!isNewRelease;
    book.tags = tags;

    if (isbn !== undefined) book.isbn = isbn;
    if (description !== undefined) book.description = description;
    if (finalCoverImage !== undefined) book.coverImage = finalCoverImage;
    if (pages !== undefined) book.pages = pages;
    if (publicationYear !== undefined) book.publicationYear = publicationYear;
    if (publishedDate !== undefined) book.publishedDate = publishedDate;
    if (stock !== undefined) {
      const previousStock = book.stock ?? 0;
      const previousAvailable = book.available ?? 0;
      const borrowed = Math.max(previousStock - previousAvailable, 0);

      const newStock = stock;
      let newAvailable = newStock - borrowed;

      // available không được âm và không được lớn hơn stock
      if (newAvailable < 0) newAvailable = 0;
      if (newAvailable > newStock) newAvailable = newStock;

      book.stock = newStock;
      book.available = newAvailable;
    }
    if (volume !== undefined) book.volume = volume;

    await book.save();
    await book.populate('authorId', 'name nationality').catch(() => null);
    await book.populate('publisherId', 'name').catch(() => null);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sách thành công',
      data: { book }
    });
  } catch (error) {
    return handleLibrarianBookError(error, res, 'cập nhật');
  }
};

export const deleteBookForLibrarian = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID sách là bắt buộc' });
    }

    // Find book by ID or slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ slug: id });
    }
    if (!book) {
      return res.status(404).json({ success: false, message: 'Sách không tồn tại' });
    }

    await book.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Xóa sách thành công'
    });
  } catch (error) {
    return handleLibrarianBookError(error, res, 'xóa');
  }
};

const handleLibrarianBookError = (error: unknown, res: Response, action: string) => {
  console.error(`Error ${action} book for librarian:`, error);

  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. ')
    });
  }

  if (error instanceof MongoServerError) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu bị trùng lặp (ví dụ: ISBN đã tồn tại)'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi cơ sở dữ liệu'
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  return res.status(500).json({ success: false, message: 'Server error' });
};
