"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePublisherStatus = exports.deletePublisher = exports.updatePublisher = exports.createPublisher = exports.getPublisherById = exports.getAllPublishers = void 0;
const Publisher_1 = __importDefault(require("../models/Publisher"));
const Book_1 = __importDefault(require("../models/Book"));
// GET /admin/publishers - Lấy danh sách tất cả nhà xuất bản
const getAllPublishers = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive, search, sort = 'createdAt', order = 'desc', from, to } = req.query;
        const skip = ((Number(page) - 1) * Number(limit));
        let query = {};
        // Filter by isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        // Search by name, description, or address
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
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
        const publishers = await Publisher_1.default.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))
            .populate('bookCount');
        const total = await Publisher_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                publishers,
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
        console.error('Error getting publishers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getAllPublishers = getAllPublishers;
// GET /admin/publishers/:id - Lấy thông tin chi tiết nhà xuất bản
const getPublisherById = async (req, res) => {
    try {
        const { id } = req.params;
        const publisher = await Publisher_1.default.findById(id).populate('bookCount');
        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: 'Nhà xuất bản không tồn tại'
            });
        }
        res.status(200).json({
            success: true,
            data: { publisher }
        });
    }
    catch (error) {
        console.error('Error getting publisher:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getPublisherById = getPublisherById;
// POST /admin/publishers - Tạo nhà xuất bản mới
const createPublisher = async (req, res) => {
    try {
        const { name, description, address, phone, email, website } = req.body;
        // Check if publisher with same name already exists
        const existingPublisher = await Publisher_1.default.findOne({ name });
        if (existingPublisher) {
            return res.status(400).json({
                success: false,
                message: 'Nhà xuất bản với tên này đã tồn tại'
            });
        }
        const publisher = new Publisher_1.default({
            name,
            description,
            address,
            phone,
            email,
            website
        });
        await publisher.save();
        res.status(201).json({
            success: true,
            message: 'Tạo nhà xuất bản thành công',
            data: { publisher }
        });
    }
    catch (error) {
        console.error('Error creating publisher:', error);
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
exports.createPublisher = createPublisher;
// PUT /admin/publishers/:id - Cập nhật nhà xuất bản
const updatePublisher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, address, phone, email, website, isActive } = req.body;
        // Check if publisher exists
        const publisher = await Publisher_1.default.findById(id);
        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: 'Nhà xuất bản không tồn tại'
            });
        }
        // Check if name is being changed and if new name already exists
        if (name && name !== publisher.name) {
            const existingPublisher = await Publisher_1.default.findOne({ name, _id: { $ne: id } });
            if (existingPublisher) {
                return res.status(400).json({
                    success: false,
                    message: 'Nhà xuất bản với tên này đã tồn tại'
                });
            }
        }
        const updatedPublisher = await Publisher_1.default.findByIdAndUpdate(id, { name, description, address, phone, email, website, isActive }, { new: true, runValidators: true }).populate('bookCount');
        res.status(200).json({
            success: true,
            message: 'Cập nhật nhà xuất bản thành công',
            data: { publisher: updatedPublisher }
        });
    }
    catch (error) {
        console.error('Error updating publisher:', error);
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
exports.updatePublisher = updatePublisher;
// DELETE /admin/publishers/:id - Xóa nhà xuất bản
const deletePublisher = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if publisher exists
        const publisher = await Publisher_1.default.findById(id);
        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: 'Nhà xuất bản không tồn tại'
            });
        }
        // Chặn xóa nếu còn sách tham chiếu tới nhà xuất bản
        const booksWithPublisher = await Book_1.default.countDocuments({ publisherId: id });
        if (booksWithPublisher > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa nhà xuất bản này vì có ${booksWithPublisher} cuốn sách đang sử dụng`
            });
        }
        await Publisher_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Xóa nhà xuất bản thành công'
        });
    }
    catch (error) {
        console.error('Error deleting publisher:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.deletePublisher = deletePublisher;
// PUT /admin/publishers/:id/toggle-status - Bật/tắt nhà xuất bản
const togglePublisherStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if publisher exists
        const publisher = await Publisher_1.default.findById(id);
        if (!publisher) {
            return res.status(404).json({
                success: false,
                message: 'Nhà xuất bản không tồn tại'
            });
        }
        // Toggle isActive status
        const newStatus = !publisher.isActive;
        const updatedPublisher = await Publisher_1.default.findByIdAndUpdate(id, { isActive: newStatus }, { new: true }).populate('bookCount');
        res.status(200).json({
            success: true,
            message: `Nhà xuất bản đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
            data: {
                publisher: updatedPublisher,
                isActive: newStatus
            }
        });
    }
    catch (error) {
        console.error('Error toggling publisher status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.togglePublisherStatus = togglePublisherStatus;
//# sourceMappingURL=publisherController.js.map