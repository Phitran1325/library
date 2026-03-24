"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookForLibrarian = exports.updateBookForLibrarian = exports.createBookForLibrarian = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const Book_1 = __importDefault(require("../models/Book"));
const Author_1 = __importDefault(require("../models/Author"));
const Publisher_1 = __importDefault(require("../models/Publisher"));
const Tag_1 = __importDefault(require("../models/Tag"));
const createBookForLibrarian = async (req, res) => {
    try {
        const { title, language, category, rentalPrice, authorId, publisherId, isbn, description, coverImage, pages, publicationYear, publishedDate, stock = 0, volume, isNewRelease = false, tags = [] } = req.body;
        // 1. Validate required fields
        if (!title || !language || !category || rentalPrice === undefined || !authorId || !publisherId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: title, language, category, rentalPrice, authorId, publisherId'
            });
        }
        // 2. Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({ success: false, message: 'authorId không hợp lệ' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
            return res.status(400).json({ success: false, message: 'publisherId không hợp lệ' });
        }
        // 3. Validate author exists
        const author = await Author_1.default.findOne({ _id: authorId, isActive: true });
        if (!author) {
            return res.status(400).json({ success: false, message: 'Tác giả không tồn tại hoặc đã bị vô hiệu hóa' });
        }
        // 4. Validate publisher exists
        const publisher = await Publisher_1.default.findOne({ _id: publisherId, isActive: true });
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
            const validTags = await Tag_1.default.find({ name: { $in: tags }, isActive: true });
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
            const existingBook = await Book_1.default.findOne({ isbn });
            if (existingBook) {
                return res.status(400).json({ success: false, message: 'Sách với ISBN này đã tồn tại' });
            }
        }
        // 8. Create book
        const book = new Book_1.default({
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
            available: stock,
            volume,
            isNewRelease,
            tags
        });
        await book.save();
        // 9. Populate author and publisher safely
        await book.populate('authorId', 'name nationality').catch(() => null);
        await book.populate('publisherId', 'name').catch(() => null);
        res.status(201).json({
            success: true,
            message: 'Tạo sách thành công',
            data: { book }
        });
    }
    catch (error) {
        return handleLibrarianBookError(error, res, 'tạo');
    }
};
exports.createBookForLibrarian = createBookForLibrarian;
const updateBookForLibrarian = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, language, category, rentalPrice, authorId, publisherId, isbn, description, coverImage, pages, publicationYear, publishedDate, stock, volume, isNewRelease = false, tags = [] } = req.body;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
        }
        if (!title || !language || !category || rentalPrice === undefined || !authorId || !publisherId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: title, language, category, rentalPrice, authorId, publisherId'
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({ success: false, message: 'authorId không hợp lệ' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
            return res.status(400).json({ success: false, message: 'publisherId không hợp lệ' });
        }
        const book = await Book_1.default.findById(id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Sách không tồn tại' });
        }
        if (isbn && isbn !== book.isbn) {
            const existingBook = await Book_1.default.findOne({ isbn, _id: { $ne: id } });
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
        const author = await Author_1.default.findOne({ _id: authorId, isActive: true });
        if (!author) {
            return res.status(400).json({ success: false, message: 'Tác giả không tồn tại hoặc đã bị vô hiệu hóa' });
        }
        const publisher = await Publisher_1.default.findOne({ _id: publisherId, isActive: true });
        if (!publisher) {
            return res.status(400).json({ success: false, message: 'Nhà xuất bản không tồn tại hoặc đã bị vô hiệu hóa' });
        }
        if (tags.length > 0) {
            const validTags = await Tag_1.default.find({ name: { $in: tags }, isActive: true });
            if (validTags.length !== tags.length) {
                const invalidTags = tags.filter(tag => !validTags.find(vt => vt.name === tag));
                return res.status(400).json({
                    success: false,
                    message: `Các tag sau không tồn tại hoặc đã bị vô hiệu hóa: ${invalidTags.join(', ')}`
                });
            }
        }
        book.title = title;
        book.language = language;
        book.category = category;
        book.rentalPrice = rentalPrice;
        book.authorId = new mongoose_1.default.Types.ObjectId(authorId);
        book.publisherId = new mongoose_1.default.Types.ObjectId(publisherId);
        book.isNewRelease = !!isNewRelease;
        book.tags = tags;
        if (isbn !== undefined)
            book.isbn = isbn;
        if (description !== undefined)
            book.description = description;
        if (coverImage !== undefined)
            book.coverImage = coverImage;
        if (pages !== undefined)
            book.pages = pages;
        if (publicationYear !== undefined)
            book.publicationYear = publicationYear;
        if (publishedDate !== undefined)
            book.publishedDate = publishedDate;
        if (stock !== undefined) {
            book.stock = stock;
            book.available = Math.min(book.available, stock);
        }
        if (volume !== undefined)
            book.volume = volume;
        await book.save();
        await book.populate('authorId', 'name nationality').catch(() => null);
        await book.populate('publisherId', 'name').catch(() => null);
        return res.status(200).json({
            success: true,
            message: 'Cập nhật sách thành công',
            data: { book }
        });
    }
    catch (error) {
        return handleLibrarianBookError(error, res, 'cập nhật');
    }
};
exports.updateBookForLibrarian = updateBookForLibrarian;
const deleteBookForLibrarian = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
        }
        const book = await Book_1.default.findById(id);
        if (!book) {
            return res.status(404).json({ success: false, message: 'Sách không tồn tại' });
        }
        await book.deleteOne();
        return res.status(200).json({
            success: true,
            message: 'Xóa sách thành công'
        });
    }
    catch (error) {
        return handleLibrarianBookError(error, res, 'xóa');
    }
};
exports.deleteBookForLibrarian = deleteBookForLibrarian;
const handleLibrarianBookError = (error, res, action) => {
    console.error(`Error ${action} book for librarian:`, error);
    if (error instanceof mongoose_1.default.Error.ValidationError) {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
            success: false,
            message: messages.join('. ')
        });
    }
    if (error instanceof mongodb_1.MongoServerError) {
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
//# sourceMappingURL=createBookForLibrarian.js.map