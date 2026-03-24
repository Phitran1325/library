import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Book, { IBook } from '../models/Book';
import Author from '../models/Author';
import Publisher from '../models/Publisher';
import Tag from '../models/Tag';
import User from '../models/User';
import { uploadEbookBuffer, EbookFormat, generateEbookDownloadUrl } from '../services/uploadService';
import type { Multer } from 'multer';


interface AuthRequest extends Request {
  user?: any;
file?: Express.Multer.File | undefined;
}

// GET /admin/books - Lấy danh sách tất cả sách
export const getAllBooks = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      categoryId,
      status,
      isActive,
      isNewRelease,
      author, // legacy alias for authorId
      authorId,
      authorName,
      publisher, // legacy alias for publisherId
      publisherId,
      title,
      search, 
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query as any;
    
    const skip = ((Number(page) - 1) * Number(limit));
    
    let query: any = {};

    // Filter by category
    if (category) query.category = category;
    
    // Filter by categoryId
    if (categoryId) query.categoryId = categoryId;
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by isActive
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Filter by isNewRelease
    if (isNewRelease !== undefined) {
      query.isNewRelease = isNewRelease === 'true';
    }
    
    // Filter by authorId (supports legacy 'author')
    if (authorId || author) query.authorId = authorId || author;
    
    // Filter by publisherId (supports legacy 'publisher')
    if (publisherId || publisher) query.publisherId = publisherId || publisher;
    
    // Filter by title
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    
    // Filter by authorName (convert to authorId list)
    if (authorName) {
      const matchedAuthors = await Author.find({ name: { $regex: String(authorName), $options: 'i' }, isActive: true }).select('_id');
      const authorIds = matchedAuthors.map(a => a._id);
      // If no authors match, return empty result early
      if (authorIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            books: [],
            pagination: {
              total: 0,
              page: Number(page),
              limit: Number(limit),
              pages: 0,
            },
          },
        });
      }
      query.authorId = { $in: authorIds };
    }
    
    // Generic search: primarily by title; keep backward compatibility
    if (search) {
      query.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { tags: { $in: [new RegExp(String(search), 'i')] } },
        { isbn: { $regex: String(search), $options: 'i' } }
      ];
    }

    const sortObj: any = {};
    sortObj[String(sort)] = order === 'desc' ? -1 : 1;

    const books = await Book.find(query)
      .populate('authorId', 'name nationality')
      .populate('publisherId', 'name')
      .populate('borrowCount')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /admin/books/:id - Lấy thông tin chi tiết sách (by ID hoặc slug)
export const getBookById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, if invalid ObjectId, try by slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id)
        .populate('authorId', 'name biography nationality')
        .populate('publisherId', 'name address website')
        .populate('borrowCount');
    }

    // If not found by ID, try by slug
    if (!book) {
      book = await Book.findOne({ slug: id })
        .populate('authorId', 'name biography nationality')
        .populate('publisherId', 'name address website')
        .populate('borrowCount');
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại'
      });
    }

    res.status(200).json({
      success: true,
      data: { book }
    });
  } catch (error) {
    console.error('Error getting book:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// POST /admin/books - Tạo sách mới
export const createBook = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      isbn, 
      description, 
      coverImage, 
      pages, 
      publicationYear,
      publishedDate,
      language, 
      category,
      categoryId,
      price,
      rentalPrice,
      stock, 
      volume,
      isNewRelease,
      authorId,
      publisherId,
      tags 
    } = req.body;

    // Required field checks aligned with schema
    if (!title || !language || !category || rentalPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, language, category, rentalPrice.'
      });
    }

    // Check if book with same ISBN already exists
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'Sách với ISBN này đã tồn tại'
        });
      }
    }

    // Validate category
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

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không hợp lệ. Chỉ cho phép 10 thể loại: ' + allowedCategories.join(', ')
      });
    }

    // Validate author exists
    if (!authorId) {
      return res.status(400).json({ success: false, message: 'Tác giả là bắt buộc' });
    }
    const validAuthor = await Author.findOne({ _id: authorId, isActive: true });
    if (!validAuthor) {
      return res.status(400).json({
        success: false,
        message: 'Tác giả không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    // Validate publisher exists
    if (!publisherId) {
      return res.status(400).json({ success: false, message: 'Nhà xuất bản là bắt buộc' });
    }
    const validPublisher = await Publisher.findOne({ _id: publisherId, isActive: true });
    if (!validPublisher) {
      return res.status(400).json({
        success: false,
        message: 'Nhà xuất bản không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    // Validate tags exist and are active
    if (tags && tags.length > 0) {
      const validTags = await Tag.find({ name: { $in: tags }, isActive: true });
      if (validTags.length !== tags.length) {
        const invalidTags = tags.filter((tag: string) => !validTags.find(vt => vt.name === tag));
        return res.status(400).json({
          success: false,
          message: `Các tag sau không tồn tại hoặc đã bị vô hiệu hóa: ${invalidTags.join(', ')}`
        });
      }
    }

    const book = new Book({
      title,
      isbn,
      description,
      coverImage,
      pages,
      publicationYear,
      publishedDate,
      language: language || 'Vietnamese',
      category,
      categoryId,
      price,
      rentalPrice,
      stock: stock || 0,
      available: stock || 0,
      volume,
      isNewRelease: isNewRelease || false,
      authorId,
      publisherId,
      tags: tags || []
    });

    await book.save();
    await book.populate('authorId', 'name nationality');
    await book.populate('publisherId', 'name');

    res.status(201).json({
      success: true,
      message: 'Tạo sách thành công',
      data: { book }
    });
  } catch (error: any) {
    console.error('Error creating book:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// PUT /admin/books/:id - Cập nhật sách
export const updateBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      isbn,
      description,
      coverImage,
      pages,
      publicationYear,
      publishedDate,
      language,
      category,
      categoryId,
      price,
      stock,
      volume,
      isNewRelease,
      authors,
      publisher,
      tags,
      status,
      isActive
    } = req.body;

    // Find book by ID or slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ slug: id });
    }
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại'
      });
    }

    // Check if ISBN is being changed and if new ISBN already exists
    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn, _id: { $ne: id } });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'Sách với ISBN này đã tồn tại'
        });
      }
    }

    // Validate category if provided
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

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không hợp lệ. Chỉ cho phép 10 thể loại: ' + allowedCategories.join(', ')
      });
    }

    // Validate authors if provided
    if (authors && authors.length > 0) {
      const validAuthors = await Author.find({ _id: { $in: authors }, isActive: true });
      if (validAuthors.length !== authors.length) {
        return res.status(400).json({
          success: false,
          message: 'Một hoặc nhiều tác giả không tồn tại hoặc đã bị vô hiệu hóa'
        });
      }
    }

    // Validate publisher if provided
    if (publisher) {
      const validPublisher = await Publisher.findOne({ _id: publisher, isActive: true });
      if (!validPublisher) {
        return res.status(400).json({
          success: false,
          message: 'Nhà xuất bản không tồn tại hoặc đã bị vô hiệu hóa'
        });
      }
    }

    // Validate tags if provided
    if (tags && tags.length > 0) {
      const validTags = await Tag.find({ name: { $in: tags }, isActive: true });
      if (validTags.length !== tags.length) {
        const invalidTags = tags.filter((tag: string) => !validTags.find(vt => vt.name === tag));
        return res.status(400).json({
          success: false,
          message: `Các tag sau không tồn tại hoặc đã bị vô hiệu hóa: ${invalidTags.join(', ')}`
        });
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { 
        title, 
        isbn, 
        description, 
        coverImage, 
        pages, 
        publicationYear,
        publishedDate,
        language, 
        category,
        categoryId,
        price, 
        stock, 
        volume,
        isNewRelease,
        authors, 
        publisher, 
        tags, 
        status, 
        isActive 
      },
      { new: true, runValidators: true }
    )
    .populate('authors', 'name nationality')
    .populate('publisher', 'name');

    res.status(200).json({
      success: true,
      message: 'Cập nhật sách thành công',
      data: { book: updatedBook }
    });
  } catch (error: any) {
    console.error('Error updating book:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// DELETE /admin/books/:id - Xóa sách
export const deleteBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find book by ID or slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ slug: id });
    }
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại'
      });
    }

    // TODO: Check if book has borrow records when Borrow model is available
    // const Borrow = require('../models/Borrow').default;
    // const borrowsWithBook = await Borrow.countDocuments({ book: id, status: 'Borrowed' });
    // 
    // if (borrowsWithBook > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Không thể xóa sách này vì có ${borrowsWithBook} lượt mượn đang hoạt động`
    //   });
    // }

    await Book.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: 'Xóa sách thành công'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// PUT /admin/books/:id/toggle-status - Bật/tắt sách
export const toggleBookStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find book by ID or slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ slug: id });
    }
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại'
      });
    }

    // Toggle isActive status
    const newStatus = !book.isActive;
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { isActive: newStatus },
      { new: true }
    )
    .populate('authors', 'name nationality')
    .populate('publisher', 'name');

    res.status(200).json({ 
      success: true,
      message: `Sách đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: { 
        book: updatedBook,
        isActive: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling book status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// PUT /admin/books/:id/update-stock - Cập nhật số lượng sách
export const updateBookStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stock, available } = req.body;

    // Find book by ID or slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findById(id);
    }
    if (!book) {
      book = await Book.findOne({ slug: id });
    }
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại'
      });
    }

    // Validate stock and available
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không được âm'
      });
    }

    if (available !== undefined && available < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng có sẵn không được âm'
      });
    }

    if (available !== undefined && stock !== undefined && available > stock) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng có sẵn không được lớn hơn số lượng tồn kho'
      });
    }

    const updateData: any = {};
    if (stock !== undefined) updateData.stock = stock;
    if (available !== undefined) updateData.available = available;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('authors', 'name nationality')
    .populate('publisher', 'name');

    res.status(200).json({
      success: true,
      message: 'Cập nhật số lượng sách thành công',
      data: { book: updatedBook }
    });
  } catch (error) {
    console.error('Error updating book stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /admin/books/new-releases - Lấy danh sách sách mới phát hành
export const getNewReleases = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const books = await Book.find({ 
      isNewRelease: true, 
      isActive: true 
    })
      .populate('authors', 'name nationality')
      .populate('publisher', 'name')
      .populate('borrowCount')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: { books }
    });
  } catch (error) {
    console.error('Error getting new releases:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /admin/books/by-volume/:volume - Lấy sách theo số tập
export const getBooksByVolume = async (req: AuthRequest, res: Response) => {
  try {
    const { volume } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = ((Number(page) - 1) * Number(limit));
    
    const books = await Book.find({ 
      volume: Number(volume),
      isActive: true 
    })
      .populate('authors', 'name nationality')
      .populate('publisher', 'name')
      .populate('borrowCount')
      .sort({ title: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Book.countDocuments({ 
      volume: Number(volume),
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting books by volume:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const mimeToEbookFormat: Record<string, EbookFormat> = {
  'application/pdf': 'PDF',
  'application/epub+zip': 'EPUB',
};

const isMembershipActive = (user: any, membershipPlan?: any) => {
  if (!user?.membershipPlanId) {
    return false;
  }

  const now = new Date();
  if (user.membershipEndDate && user.membershipEndDate < now) {
    return false;
  }

  if (
    !user.membershipEndDate &&
    user.membershipStartDate &&
    membershipPlan?.duration
  ) {
    const calculatedEndDate = new Date(user.membershipStartDate);
    calculatedEndDate.setMonth(calculatedEndDate.getMonth() + membershipPlan.duration);
    if (calculatedEndDate < now) {
      return false;
    }
  }

  return true;
};

const membershipHasEbookFeature = (membershipPlan?: any) => {
  if (!membershipPlan) return false;
  const features = Array.isArray(membershipPlan.features) ? membershipPlan.features : [];
  return features.some((feature: string) => {
    const lower = feature?.toLowerCase?.() || '';
    return lower.includes('ebook') || lower.includes('digital');
  });
};

const canDownloadEbook = (user: any, book: IBook) => {
  if (!user) {
    return { allowed: false, message: 'Người dùng không hợp lệ' };
  }

  const role = (user.role || '').toString().toLowerCase();
  if (role === 'admin' || role === 'librarian') {
    return { allowed: true };
  }

  const membershipPlan = user.membershipPlanId as any;
  if (!isMembershipActive(user, membershipPlan)) {
    return {
      allowed: false,
      message: 'Bạn cần gói thành viên còn hiệu lực để tải sách điện tử.',
    };
  }

  if (book.isPremium) {
    const planName = (membershipPlan?.name || '').toString().toLowerCase();
    const hasPremiumPlan = planName.includes('premium');
    if (!hasPremiumPlan) {
      return {
        allowed: false,
        message: 'Sách điện tử này chỉ dành cho thành viên Premium.',
      };
    }
  }

  if (!membershipHasEbookFeature(membershipPlan)) {
    return {
      allowed: false,
      message: 'Gói thành viên hiện tại chưa hỗ trợ tải sách điện tử.',
    };
  }

  return { allowed: true };
};

/**
 * POST /api/librarian/books/:id/ebooks
 * Upload ebooks (PDF/EPUB) for a book
 */
export const uploadBookEbook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file PDF hoặc EPUB để tải lên',
      });
    }

    const format = mimeToEbookFormat[req.file.mimetype];
    if (!format) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng file không được hỗ trợ (chỉ PDF/EPUB)',
      });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách',
      });
    }

    const uploadResult = await uploadEbookBuffer(req.file.buffer, {
      format,
      fileName: req.file.originalname?.split('.').slice(0, -1).join('.') || undefined,
    });

    const digitalFile = {
      _id: new mongoose.Types.ObjectId(),
      format,
      publicId: uploadResult.publicId,
      url: uploadResult.url,
      size: uploadResult.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    if (!book.digitalFiles) {
      book.digitalFiles = [];
    }
    book.digitalFiles.push(digitalFile as any);
    await book.save();

    return res.status(201).json({
      success: true,
      message: 'Tải ebook thành công',
      data: { file: digitalFile },
    });
  } catch (error: any) {
    console.error('Error in uploadBookEbook:', error);
    const message = error?.message?.includes('Cloudinary')
      ? 'Không thể tải lên Cloudinary, vui lòng thử lại sau'
      : 'Không thể tải ebook';
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/books/:bookId/ebooks/:fileId/download
 * Generate signed url for ebook download
 */
export const downloadBookEbook = async (req: AuthRequest, res: Response) => {
  try {
    const { id: bookId, fileId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ',
      });
    }

    const [book, user] = await Promise.all([
      Book.findById(bookId),
      User.findById(userId).populate('membershipPlanId'),
    ]);

    if (!book || !book.digitalFiles || book.digitalFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sách không có ebook hoặc không tồn tại',
      });
    }

    const digitalFile = book.digitalFiles.find(
      (file: any) => file._id?.toString() === fileId.toString()
    );
    if (!digitalFile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ebook yêu cầu',
      });
    }

    const permission = canDownloadEbook(user, book);
    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        message: permission.message || 'Bạn không có quyền tải ebook này',
      });
    }

    const downloadInfo = generateEbookDownloadUrl(
      digitalFile.publicId,
      digitalFile.format || 'pdf'
    );

    return res.status(200).json({
      success: true,
      message: 'Tạo link tải ebook thành công',
      data: downloadInfo,
    });
  } catch (error) {
    console.error('Error in downloadBookEbook:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo link tải ebook',
    });
  }
};

/**
 * GET /api/books/:id/ebooks
 * Danh sách ebook của một sách (yêu cầu auth)
 */
export const listBookEbooks = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sách không hợp lệ',
      });
    }

    const [book, user] = await Promise.all([
      Book.findById(id).select('title isPremium digitalFiles'),
      User.findById(userId).populate('membershipPlanId'),
    ]);

    if (!book || !book.digitalFiles || book.digitalFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sách không có ebook hoặc không tồn tại',
      });
    }

    const permission = canDownloadEbook(user, book);

    const files = book.digitalFiles.map((file: any) => ({
      id: file._id,
      format: file.format,
      size: file.size,
      uploadedAt: file.uploadedAt,
      canDownload: permission.allowed,
    }));

    return res.status(200).json({
      success: true,
      data: {
        book: {
          id: book._id,
          title: book.title,
          isPremium: book.isPremium,
        },
        files,
        canDownload: permission.allowed,
        reason: permission.allowed ? undefined : permission.message,
      },
    });
  } catch (error) {
    console.error('Error in listBookEbooks:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách ebook',
    });
  }
};

// ========== PUBLIC USER API ENDPOINTS ==========

// GET /books - Lấy danh sách sách (công khai - chỉ sách đang hoạt động)
export const getPublicBooks = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      categoryId,
      isNewRelease,
      authorId,
      authorName,
      publisherId,
      title,
      search, 
      hasEbook,
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query as any;
    
    const skip = ((Number(page) - 1) * Number(limit));
    
    // Chỉ lấy sách đang hoạt động và có sẵn
    let query: any = {
      isActive: true,
      status: 'available'
    };

    // Filter by category
    if (category) query.category = category;
    
    // Filter by categoryId
    if (categoryId) query.categoryId = categoryId;
    
    // Filter by isNewRelease
    if (isNewRelease !== undefined) {
      query.isNewRelease = isNewRelease === 'true';
    }
    
    // Filter by authorId
    if (authorId) query.authorId = authorId;
    
    // Filter by publisherId
    if (publisherId) query.publisherId = publisherId;
    
    // Filter by title
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    
    // Filter by authorName (convert to authorId list)
    if (authorName) {
      const matchedAuthors = await Author.find({ 
        name: { $regex: String(authorName), $options: 'i' }, 
        isActive: true 
      }).select('_id');
      const authorIds = matchedAuthors.map(a => a._id);
      // If no authors match, return empty result early
      if (authorIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            books: [],
            pagination: {
              total: 0,
              page: Number(page),
              limit: Number(limit),
              pages: 0,
            },
          },
        });
      }
      query.authorId = { $in: authorIds };
    }
    
    // Filter by ebook availability
    if (hasEbook === 'true') {
      query.digitalFiles = { $exists: true, $not: { $size: 0 } };
    }
    
    // Generic search: primarily by title; keep backward compatibility
    if (search) {
      query.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { tags: { $in: [new RegExp(String(search), 'i')] } },
        { isbn: { $regex: String(search), $options: 'i' } }
      ];
    }

    const sortObj: any = {};
    sortObj[String(sort)] = order === 'desc' ? -1 : 1;

    const books = await Book.find(query)
      .populate('authorId', 'name nationality')
      .populate('publisherId', 'name')
      .populate('borrowCount')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting public books:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /books/count - Đếm tổng số sách (công khai)
export const getPublicBookCount = async (_req: Request, res: Response) => {
  try {
    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      success: true,
      data: { totalBooks }
    });
  } catch (error) {
    console.error('Error getting public book count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET /books/:id - Lấy thông tin chi tiết sách (công khai - by ID hoặc slug)
export const getPublicBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, if invalid ObjectId, try by slug
    let book;
    if (mongoose.Types.ObjectId.isValid(id)) {
      book = await Book.findOne({
        _id: id,
        isActive: true,
        status: 'available'
      })
        .populate('authorId', 'name biography nationality')
        .populate('publisherId', 'name address website')
        .populate('borrowCount');
    }

    // If not found by ID, try by slug
    if (!book) {
      book = await Book.findOne({
        slug: id,
        isActive: true,
        status: 'available'
      })
        .populate('authorId', 'name biography nationality')
        .populate('publisherId', 'name address website')
        .populate('borrowCount');
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Sách không tồn tại hoặc không có sẵn'
      });
    }

    res.status(200).json({ 
      success: true,
      data: { book }
    });
  } catch (error) {
    console.error('Error getting public book:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
