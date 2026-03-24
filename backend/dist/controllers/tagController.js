"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTagStats = exports.toggleTagStatus = exports.updateTag = exports.createTag = exports.getTagById = exports.getAllTags = void 0;
const Tag_1 = __importDefault(require("../models/Tag"));
// GET /admin/tags - Lấy danh sách tất cả tags
const getAllTags = async (req, res) => {
    try {
        const { page = 1, limit = 50, category, isActive, search, sort = 'name', order = 'asc' } = req.query;
        const skip = ((Number(page) - 1) * Number(limit));
        let query = {};
        // Filter by category
        if (category)
            query.category = category;
        // Filter by isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = {};
        sortObj[String(sort)] = sortOrder;
        const tags = await Tag_1.default.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));
        const total = await Tag_1.default.countDocuments(query);
        res.json({
            success: true,
            data: {
                tags,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getAllTags = getAllTags;
// GET /admin/tags/:id - Lấy tag theo ID
const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await Tag_1.default.findById(id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag không tồn tại'
            });
        }
        res.json({
            success: true,
            data: { tag }
        });
    }
    catch (error) {
        console.error('Error getting tag:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getTagById = getTagById;
// POST /admin/tags - Tạo tag mới
const createTag = async (req, res) => {
    try {
        const { name, category } = req.body;
        // Validate required fields
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: 'Tên tag và thể loại là bắt buộc'
            });
        }
        // Check if tag already exists
        const existingTag = await Tag_1.default.findOne({ name });
        if (existingTag) {
            return res.status(400).json({
                success: false,
                message: 'Tag này đã tồn tại'
            });
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
        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Thể loại không hợp lệ. Chỉ cho phép 10 thể loại: ' + allowedCategories.join(', ')
            });
        }
        const tag = new Tag_1.default({
            name,
            category
        });
        await tag.save();
        res.status(201).json({
            success: true,
            message: 'Tạo tag thành công',
            data: { tag }
        });
    }
    catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.createTag = createTag;
// PUT /admin/tags/:id - Cập nhật tag
const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, isActive } = req.body;
        // Check if tag exists
        const tag = await Tag_1.default.findById(id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag không tồn tại'
            });
        }
        // Check if new name already exists (if name is being changed)
        if (name && name !== tag.name) {
            const existingTag = await Tag_1.default.findOne({ name, _id: { $ne: id } });
            if (existingTag) {
                return res.status(400).json({
                    success: false,
                    message: 'Tag với tên này đã tồn tại'
                });
            }
        }
        // Validate category if provided
        if (category) {
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
                    message: 'Thể loại không hợp lệ. Chỉ cho phép 10 thể loại: ' + allowedCategories.join(', ')
                });
            }
        }
        const updatedTag = await Tag_1.default.findByIdAndUpdate(id, { name, category, isActive }, { new: true, runValidators: true });
        res.json({
            success: true,
            message: 'Cập nhật tag thành công',
            data: { tag: updatedTag }
        });
    }
    catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.updateTag = updateTag;
// PUT /admin/tags/:id/toggle - Bật/tắt tag
const toggleTagStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await Tag_1.default.findById(id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag không tồn tại'
            });
        }
        tag.isActive = !tag.isActive;
        await tag.save();
        res.json({
            success: true,
            message: `Tag đã được ${tag.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
            data: { tag }
        });
    }
    catch (error) {
        console.error('Error toggling tag status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.toggleTagStatus = toggleTagStatus;
// GET /admin/tags/stats - Thống kê tags
const getTagStats = async (req, res) => {
    try {
        const totalTags = await Tag_1.default.countDocuments();
        const activeTags = await Tag_1.default.countDocuments({ isActive: true });
        const inactiveTags = await Tag_1.default.countDocuments({ isActive: false });
        // Tags by category
        const tagsByCategory = await Tag_1.default.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        // Most used tags
        const mostUsedTags = await Tag_1.default.find({ isActive: true })
            .sort({ bookCount: -1 })
            .limit(10)
            .select('name bookCount category');
        res.json({
            success: true,
            data: {
                total: totalTags,
                active: activeTags,
                inactive: inactiveTags,
                byCategory: tagsByCategory,
                mostUsed: mostUsedTags
            }
        });
    }
    catch (error) {
        console.error('Error getting tag stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getTagStats = getTagStats;
//# sourceMappingURL=tagController.js.map