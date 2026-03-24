"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorStats = exports.toggleAuthorStatus = exports.deleteAuthor = exports.updateAuthor = exports.createAuthor = exports.getAuthorById = exports.getAllAuthors = void 0;
const Author_1 = __importDefault(require("../models/Author"));
const Book_1 = __importDefault(require("../models/Book"));
// GET /admin/authors - Lấy danh sách tất cả tác giả
const getAllAuthors = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive, nationality, search, sort = 'createdAt', order = 'desc', from, to } = req.query;
        const skip = ((Number(page) - 1) * Number(limit));
        let query = {};
        // Filter by isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        // Filter by nationality
        if (nationality) {
            query.nationality = { $regex: nationality, $options: 'i' };
        }
        // Search by name, biography, or nationality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { biography: { $regex: search, $options: 'i' } },
                { nationality: { $regex: search, $options: 'i' } },
            ];
        }
        // Date range filter
        if (from || to) {
            query.createdAt = {};
            if (from)
                query.createdAt.$gte = new Date(String(from));
            if (to)
                query.createdAt.$lte = new Date(String(to));
        }
        const sortObj = {};
        sortObj[String(sort)] = order === 'desc' ? -1 : 1;
        const authors = await Author_1.default.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))
            .populate('bookCount');
        const total = await Author_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                authors,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        console.error('Error getting authors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getAllAuthors = getAllAuthors;
// GET /admin/authors/:id - Lấy thông tin chi tiết tác giả
const getAuthorById = async (req, res) => {
    try {
        const { id } = req.params;
        const author = await Author_1.default.findById(id).populate('bookCount');
        if (!author) {
            return res.status(404).json({
                success: false,
                message: 'Tác giả không tồn tại'
            });
        }
        res.status(200).json({
            success: true,
            data: { author }
        });
    }
    catch (error) {
        console.error('Error getting author:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getAuthorById = getAuthorById;
// POST /admin/authors - Tạo tác giả mới
const createAuthor = async (req, res) => {
    try {
        const { name, biography, birthDate, nationality, website, socialMedia } = req.body;
        // Check if author with same name already exists
        const existingAuthor = await Author_1.default.findOne({ name });
        if (existingAuthor) {
            return res.status(400).json({
                success: false,
                message: 'Tác giả với tên này đã tồn tại'
            });
        }
        const author = new Author_1.default({
            name,
            biography,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            nationality,
            website,
            socialMedia
        });
        await author.save();
        res.status(201).json({
            success: true,
            message: 'Tạo tác giả thành công',
            data: { author }
        });
    }
    catch (error) {
        console.error('Error creating author:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
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
exports.createAuthor = createAuthor;
// PUT /admin/authors/:id - Cập nhật tác giả
const updateAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, biography, birthDate, nationality, website, socialMedia, isActive } = req.body;
        // Check if author exists
        const author = await Author_1.default.findById(id);
        if (!author) {
            return res.status(404).json({
                success: false,
                message: 'Tác giả không tồn tại'
            });
        }
        // Check if name is being changed and if new name already exists
        if (name && name !== author.name) {
            const existingAuthor = await Author_1.default.findOne({ name, _id: { $ne: id } });
            if (existingAuthor) {
                return res.status(400).json({
                    success: false,
                    message: 'Tác giả với tên này đã tồn tại'
                });
            }
        }
        const updateData = {
            name,
            biography,
            nationality,
            website,
            socialMedia,
            isActive
        };
        if (birthDate) {
            updateData.birthDate = new Date(birthDate);
        }
        const updatedAuthor = await Author_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('bookCount');
        res.status(200).json({
            success: true,
            message: 'Cập nhật tác giả thành công',
            data: { author: updatedAuthor }
        });
    }
    catch (error) {
        console.error('Error updating author:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
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
exports.updateAuthor = updateAuthor;
// DELETE /admin/authors/:id - Xóa tác giả
const deleteAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if author exists
        const author = await Author_1.default.findById(id);
        if (!author) {
            return res.status(404).json({
                success: false,
                message: 'Tác giả không tồn tại'
            });
        }
        // Chặn xóa nếu còn sách tham chiếu tới tác giả
        const booksWithAuthor = await Book_1.default.countDocuments({ authorId: id });
        if (booksWithAuthor > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa tác giả này vì có ${booksWithAuthor} cuốn sách đang sử dụng`
            });
        }
        await Author_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Xóa tác giả thành công'
        });
    }
    catch (error) {
        console.error('Error deleting author:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.deleteAuthor = deleteAuthor;
// PUT /admin/authors/:id/toggle-status - Bật/tắt tác giả
const toggleAuthorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if author exists
        const author = await Author_1.default.findById(id);
        if (!author) {
            return res.status(404).json({
                success: false,
                message: 'Tác giả không tồn tại'
            });
        }
        // Toggle isActive status
        const newStatus = !author.isActive;
        const updatedAuthor = await Author_1.default.findByIdAndUpdate(id, { isActive: newStatus }, { new: true }).populate('bookCount');
        res.status(200).json({
            success: true,
            message: `Tác giả đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
            data: {
                author: updatedAuthor,
                isActive: newStatus
            }
        });
    }
    catch (error) {
        console.error('Error toggling author status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.toggleAuthorStatus = toggleAuthorStatus;
// GET /admin/authors/stats - Thống kê tác giả
const getAuthorStats = async (req, res) => {
    try {
        const totalAuthors = await Author_1.default.countDocuments();
        const activeAuthors = await Author_1.default.countDocuments({ isActive: true });
        const inactiveAuthors = await Author_1.default.countDocuments({ isActive: false });
        // Top authors by book count
        const topAuthors = await Author_1.default.aggregate([
            {
                $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: 'authorId',
                    as: 'books'
                }
            },
            {
                $project: {
                    name: 1,
                    bookCount: { $size: '$books' },
                    isActive: 1
                }
            },
            {
                $sort: { bookCount: -1 }
            },
            {
                $limit: 10
            }
        ]);
        // Authors by nationality
        const authorsByNationality = await Author_1.default.aggregate([
            {
                $group: {
                    _id: '$nationality',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);
        res.status(200).json({
            success: true,
            data: {
                total: totalAuthors,
                active: activeAuthors,
                inactive: inactiveAuthors,
                topAuthors,
                authorsByNationality
            }
        });
    }
    catch (error) {
        console.error('Error getting author stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getAuthorStats = getAuthorStats;
//# sourceMappingURL=authorController.js.map