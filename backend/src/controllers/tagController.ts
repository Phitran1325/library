import { Request, Response } from 'express';
import Tag from '../models/Tag';

interface AuthRequest extends Request {
  user?: any;
}

// GET /admin/tags - Lấy danh sách tất cả tags
export const getAllTags = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      category,
      isActive,
      search, 
      sort = 'name', 
      order = 'asc' 
    } = req.query;
    
    const skip = ((Number(page) - 1) * Number(limit));
    
    let query: any = {};

    // Filter by category
    if (category) query.category = category;
    
    // Filter by isActive
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    sortObj[String(sort)] = sortOrder;

    const tags = await Tag.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const total = await Tag.countDocuments(query);

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
  } catch (error: any) {
    console.error('Error getting tags:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET /admin/tags/:id - Lấy tag theo ID
export const getTagById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const tag = await Tag.findById(id);
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
  } catch (error: any) {
    console.error('Error getting tag:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// POST /admin/tags - Tạo tag mới
export const createTag = async (req: AuthRequest, res: Response) => {
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
    const existingTag = await Tag.findOne({ name });
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

    const tag = new Tag({
      name,
      category
    });

    await tag.save();

    res.status(201).json({
      success: true,
      message: 'Tạo tag thành công',
      data: { tag }
    });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// PUT /admin/tags/:id - Cập nhật tag
export const updateTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, isActive } = req.body;

    // Check if tag exists
    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag không tồn tại'
      });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({ name, _id: { $ne: id } });
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

    const updatedTag = await Tag.findByIdAndUpdate(
      id,
      { name, category, isActive },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật tag thành công',
      data: { tag: updatedTag }
    });
  } catch (error: any) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// PUT /admin/tags/:id/toggle - Bật/tắt tag
export const toggleTagStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findById(id);
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
  } catch (error: any) {
    console.error('Error toggling tag status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET /admin/tags/stats - Thống kê tags
export const getTagStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalTags = await Tag.countDocuments();
    const activeTags = await Tag.countDocuments({ isActive: true });
    const inactiveTags = await Tag.countDocuments({ isActive: false });

    // Tags by category
    const tagsByCategory = await Tag.aggregate([
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
    const mostUsedTags = await Tag.find({ isActive: true })
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
  } catch (error: any) {
    console.error('Error getting tag stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
