import { Request, Response } from 'express';
import Publisher, { IPublisher } from '../models/Publisher';
import Book from '../models/Book';

interface AuthRequest extends Request {
  user?: any;
}

// GET /admin/publishers - Lấy danh sách tất cả nhà xuất bản
export const getAllPublishers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      search, 
      sort = 'createdAt', 
      order = 'desc',
      from,
      to 
    } = req.query;
    
    const skip = ((Number(page) - 1) * Number(limit));
    
    let query: any = {};

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
      query.createdAt = {} as any;
      if (from) (query.createdAt as any).$gte = new Date(String(from));
      if (to) (query.createdAt as any).$lte = new Date(String(to));
    }

    const sortObj: any = {};
    sortObj[String(sort)] = order === 'desc' ? -1 : 1;

    const publishers = await Publisher.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('bookCount');

    const total = await Publisher.countDocuments(query);

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
  } catch (error) {
    console.error('Error getting publishers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /admin/publishers/:id - Lấy thông tin chi tiết nhà xuất bản
export const getPublisherById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const publisher = await Publisher.findById(id).populate('bookCount');

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
  } catch (error) {
    console.error('Error getting publisher:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// POST /admin/publishers - Tạo nhà xuất bản mới
export const createPublisher = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, address, phone, email, website } = req.body;

    // Check if publisher with same name already exists
    const existingPublisher = await Publisher.findOne({ name });
    if (existingPublisher) {
      return res.status(400).json({
        success: false,
        message: 'Nhà xuất bản với tên này đã tồn tại'
      });
    }

    const publisher = new Publisher({
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
  } catch (error: any) {
    console.error('Error creating publisher:', error);
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

// PUT /admin/publishers/:id - Cập nhật nhà xuất bản
export const updatePublisher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, email, website, isActive } = req.body;

    // Check if publisher exists
    const publisher = await Publisher.findById(id);
    if (!publisher) {
      return res.status(404).json({ 
        success: false,
        message: 'Nhà xuất bản không tồn tại' 
      });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== publisher.name) {
      const existingPublisher = await Publisher.findOne({ name, _id: { $ne: id } });
      if (existingPublisher) {
        return res.status(400).json({
          success: false,
          message: 'Nhà xuất bản với tên này đã tồn tại'
        });
      }
    }

    const updatedPublisher = await Publisher.findByIdAndUpdate(
      id,
      { name, description, address, phone, email, website, isActive },
      { new: true, runValidators: true }
    ).populate('bookCount');

    res.status(200).json({
      success: true,
      message: 'Cập nhật nhà xuất bản thành công',
      data: { publisher: updatedPublisher }
    });
  } catch (error: any) {
    console.error('Error updating publisher:', error);
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

// DELETE /admin/publishers/:id - Xóa nhà xuất bản
export const deletePublisher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if publisher exists
    const publisher = await Publisher.findById(id);
    if (!publisher) {
      return res.status(404).json({ 
        success: false,
        message: 'Nhà xuất bản không tồn tại' 
      });
    }

    // Chặn xóa nếu còn sách tham chiếu tới nhà xuất bản
    const booksWithPublisher = await Book.countDocuments({ publisherId: id });
    if (booksWithPublisher > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa nhà xuất bản này vì có ${booksWithPublisher} cuốn sách đang sử dụng`
      });
    }

    await Publisher.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: 'Xóa nhà xuất bản thành công'
    });
  } catch (error) {
    console.error('Error deleting publisher:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// PUT /admin/publishers/:id/toggle-status - Bật/tắt nhà xuất bản
export const togglePublisherStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if publisher exists
    const publisher = await Publisher.findById(id);
    if (!publisher) {
      return res.status(404).json({ 
        success: false,
        message: 'Nhà xuất bản không tồn tại' 
      });
    }

    // Toggle isActive status
    const newStatus = !publisher.isActive;
    const updatedPublisher = await Publisher.findByIdAndUpdate(
      id,
      { isActive: newStatus },
      { new: true }
    ).populate('bookCount');

    res.status(200).json({ 
      success: true,
      message: `Nhà xuất bản đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: { 
        publisher: updatedPublisher,
        isActive: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling publisher status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
