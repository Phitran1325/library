"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markLost = exports.markDamaged = exports.markReturned = exports.markBorrowed = exports.getBookCopyStatistics = exports.toggleBookCopyStatus = exports.deleteBookCopy = exports.updateBookCopy = exports.createBulkBookCopies = exports.createBookCopy = exports.getBookCopiesByBookId = exports.getBookCopyById = exports.getAllBookCopies = void 0;
const BookCopy_1 = __importDefault(require("../models/BookCopy"));
const Book_1 = __importDefault(require("../models/Book"));
// GET /admin/book-copies - Lấy danh sách tất cả bản sao
const getAllBookCopies = async (req, res) => {
    try {
        const { page = 1, limit = 10, bookId, status, condition, isActive, barcode, search, sort = 'createdAt', order = 'desc' } = req.query;
        const skip = ((Number(page) - 1) * Number(limit));
        let query = {};
        // Filter by bookId
        if (bookId) {
            query.bookId = bookId;
        }
        // Filter by status
        if (status) {
            query.status = status;
        }
        // Filter by condition
        if (condition) {
            query.condition = condition;
        }
        // Filter by isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        // Filter by barcode
        if (barcode) {
            query.barcode = { $regex: barcode, $options: 'i' };
        }
        // Generic search: by barcode, location, or notes
        if (search) {
            query.$or = [
                { barcode: { $regex: String(search), $options: 'i' } },
                { location: { $regex: String(search), $options: 'i' } },
                { notes: { $regex: String(search), $options: 'i' } }
            ];
        }
        const sortObj = {};
        sortObj[String(sort)] = order === 'desc' ? -1 : 1;
        const bookCopies = await BookCopy_1.default.find(query)
            .populate('bookId', 'title isbn coverImage')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));
        const total = await BookCopy_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                bookCopies,
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
        console.error('Error getting book copies:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getAllBookCopies = getAllBookCopies;
// GET /admin/book-copies/:id - Lấy thông tin chi tiết bản sao
const getBookCopyById = async (req, res) => {
    try {
        const { id } = req.params;
        const bookCopy = await BookCopy_1.default.findById(id)
            .populate('bookId', 'title isbn coverImage description authorId publisherId');
        if (!bookCopy) {
            return res.status(404).json({
                success: false,
                message: 'Bản sao không tồn tại'
            });
        }
        res.status(200).json({
            success: true,
            data: { bookCopy }
        });
    }
    catch (error) {
        console.error('Error getting book copy:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getBookCopyById = getBookCopyById;
// GET /admin/book-copies/book/:bookId - Lấy tất cả bản sao của một cuốn sách
const getBookCopiesByBookId = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 100, status, condition, isActive, sort = 'createdAt', order = 'desc' } = req.query;
        // Verify book exists
        const book = await Book_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại'
            });
        }
        const skip = ((Number(page) - 1) * Number(limit));
        let query = { bookId };
        // Filter by status
        if (status) {
            query.status = status;
        }
        // Filter by condition
        if (condition) {
            query.condition = condition;
        }
        // Filter by isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        const sortObj = {};
        sortObj[String(sort)] = order === 'desc' ? -1 : 1;
        const bookCopies = await BookCopy_1.default.find(query)
            .populate('bookId', 'title isbn')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));
        const total = await BookCopy_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                bookCopies,
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
        console.error('Error getting book copies by book ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getBookCopiesByBookId = getBookCopiesByBookId;
// POST /admin/book-copies - Tạo bản sao mới
const createBookCopy = async (req, res) => {
    try {
        const { bookId, barcode, status, location, acquisitionDate, purchasePrice, notes, condition } = req.body;
        // Validate required fields
        if (!bookId || !barcode) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: bookId, barcode'
            });
        }
        // Check if book exists
        const book = await Book_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại'
            });
        }
        // Normalize barcode to match schema: uppercase and alphanumeric only
        const normalizedBarcode = String(barcode).toUpperCase().replace(/[^A-Z0-9]/g, '');
        // Check if barcode already exists
        const existingCopy = await BookCopy_1.default.findOne({ barcode: normalizedBarcode });
        if (existingCopy) {
            return res.status(400).json({
                success: false,
                message: 'Mã vạch đã tồn tại'
            });
        }
        const bookCopy = new BookCopy_1.default({
            bookId,
            barcode: normalizedBarcode,
            status: status || 'available',
            location,
            acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
            purchasePrice,
            notes,
            condition: condition || 'good',
            isActive: true
        });
        await bookCopy.save();
        await bookCopy.populate('bookId', 'title isbn coverImage');
        // Update book stock and available count
        const updateData = { $inc: { stock: 1 } };
        if (bookCopy.status === 'available') {
            updateData.$inc.available = 1;
        }
        await Book_1.default.findByIdAndUpdate(bookId, updateData);
        res.status(201).json({
            success: true,
            message: 'Tạo bản sao thành công',
            data: { bookCopy }
        });
    }
    catch (error) {
        console.error('Error creating book copy:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã vạch đã tồn tại'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.createBookCopy = createBookCopy;
// POST /admin/book-copies/bulk - Tạo nhiều bản sao cùng lúc
const createBulkBookCopies = async (req, res) => {
    try {
        const { bookId, count, barcodePrefix, ...commonFields } = req.body;
        if (!bookId || !count) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: bookId, count'
            });
        }
        // Check if book exists
        const book = await Book_1.default.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Sách không tồn tại'
            });
        }
        const bookCopies = [];
        const errors = [];
        for (let i = 1; i <= count; i++) {
            const sequence = String(i).padStart(4, '0');
            const rawPrefix = (barcodePrefix
                ? String(barcodePrefix)
                : String(bookId).toString().substring(0, 8))
                .toUpperCase();
            const sanitizedPrefix = rawPrefix.replace(/[^A-Z0-9]/g, '');
            const barcode = `${sanitizedPrefix}${sequence}`;
            try {
                // Check if barcode already exists
                const existingCopy = await BookCopy_1.default.findOne({ barcode });
                if (existingCopy) {
                    errors.push(`Mã vạch ${barcode} đã tồn tại`);
                    continue;
                }
                const bookCopy = new BookCopy_1.default({
                    bookId,
                    barcode,
                    status: commonFields.status || 'available',
                    location: commonFields.location,
                    acquisitionDate: commonFields.acquisitionDate ? new Date(commonFields.acquisitionDate) : new Date(),
                    purchasePrice: commonFields.purchasePrice,
                    notes: commonFields.notes,
                    condition: commonFields.condition || 'good',
                    isActive: true
                });
                await bookCopy.save();
                bookCopies.push(bookCopy);
            }
            catch (error) {
                errors.push(`Lỗi tạo bản sao ${i}: ${error.message}`);
            }
        }
        // Update book stock and available count
        if (bookCopies.length > 0) {
            const availableCount = bookCopies.filter(copy => copy.status === 'available').length;
            await Book_1.default.findByIdAndUpdate(bookId, {
                $inc: {
                    stock: bookCopies.length,
                    available: availableCount
                }
            });
        }
        res.status(201).json({
            success: true,
            message: `Đã tạo ${bookCopies.length}/${count} bản sao`,
            data: {
                bookCopies,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    }
    catch (error) {
        console.error('Error creating bulk book copies:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.createBulkBookCopies = createBulkBookCopies;
// PUT /admin/book-copies/:id - Cập nhật bản sao
const updateBookCopy = async (req, res) => {
    try {
        const { id } = req.params;
        const { barcode, status, location, acquisitionDate, purchasePrice, notes, condition, isActive } = req.body;
        // Check if book copy exists
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({
                success: false,
                message: 'Bản sao không tồn tại'
            });
        }
        // Check if barcode is being changed and if new barcode already exists
        if (barcode && barcode.toUpperCase() !== bookCopy.barcode) {
            const existingCopy = await BookCopy_1.default.findOne({
                barcode: barcode.toUpperCase(),
                _id: { $ne: id }
            });
            if (existingCopy) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã vạch đã tồn tại'
                });
            }
        }
        // Update book available count based on status changes
        if (status && status !== bookCopy.status) {
            const oldStatus = bookCopy.status;
            const newStatus = status;
            // Count as available: only 'available' status
            const wasAvailable = oldStatus === 'available';
            const willBeAvailable = newStatus === 'available';
            if (wasAvailable && !willBeAvailable) {
                // From available to unavailable (borrowed, reserved, maintenance, lost, damaged)
                await Book_1.default.findByIdAndUpdate(bookCopy.bookId, {
                    $inc: { available: -1 }
                });
            }
            else if (!wasAvailable && willBeAvailable) {
                // From unavailable to available
                await Book_1.default.findByIdAndUpdate(bookCopy.bookId, {
                    $inc: { available: 1 }
                });
            }
            // If both are unavailable or both are available, no change needed
        }
        const updateData = {};
        if (barcode !== undefined)
            updateData.barcode = barcode.toUpperCase();
        if (status !== undefined)
            updateData.status = status;
        if (location !== undefined)
            updateData.location = location;
        if (acquisitionDate !== undefined)
            updateData.acquisitionDate = new Date(acquisitionDate);
        if (purchasePrice !== undefined)
            updateData.purchasePrice = purchasePrice;
        if (notes !== undefined)
            updateData.notes = notes;
        if (condition !== undefined)
            updateData.condition = condition;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const updatedBookCopy = await BookCopy_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('bookId', 'title isbn coverImage');
        res.status(200).json({
            success: true,
            message: 'Cập nhật bản sao thành công',
            data: { bookCopy: updatedBookCopy }
        });
    }
    catch (error) {
        console.error('Error updating book copy:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã vạch đã tồn tại'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.updateBookCopy = updateBookCopy;
// DELETE /admin/book-copies/:id - Xóa bản sao
const deleteBookCopy = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if book copy exists
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({
                success: false,
                message: 'Bản sao không tồn tại'
            });
        }
        // Check if copy is currently borrowed or reserved
        if (bookCopy.status === 'borrowed' || bookCopy.status === 'reserved') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa bản sao đang được mượn hoặc đặt trước'
            });
        }
        // Update book stock and available count
        await Book_1.default.findByIdAndUpdate(bookCopy.bookId, {
            $inc: {
                stock: -1,
                available: bookCopy.status === 'available' ? -1 : 0
            }
        });
        await BookCopy_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Xóa bản sao thành công'
        });
    }
    catch (error) {
        console.error('Error deleting book copy:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.deleteBookCopy = deleteBookCopy;
// PUT /admin/book-copies/:id/toggle-status - Bật/tắt bản sao
const toggleBookCopyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if book copy exists
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({
                success: false,
                message: 'Bản sao không tồn tại'
            });
        }
        // Toggle isActive status
        const newStatus = !bookCopy.isActive;
        const updatedBookCopy = await BookCopy_1.default.findByIdAndUpdate(id, { isActive: newStatus }, { new: true })
            .populate('bookId', 'title isbn');
        res.status(200).json({
            success: true,
            message: `Bản sao đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
            data: {
                bookCopy: updatedBookCopy,
                isActive: newStatus
            }
        });
    }
    catch (error) {
        console.error('Error toggling book copy status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.toggleBookCopyStatus = toggleBookCopyStatus;
// GET /admin/book-copies/statistics - Thống kê bản sao
const getBookCopyStatistics = async (req, res) => {
    try {
        const { bookId } = req.query;
        let matchQuery = {};
        if (bookId) {
            matchQuery.bookId = bookId;
        }
        const statistics = await BookCopy_1.default.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        const conditionStats = await BookCopy_1.default.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 }
                }
            }
        ]);
        const total = await BookCopy_1.default.countDocuments(matchQuery);
        const active = await BookCopy_1.default.countDocuments({ ...matchQuery, isActive: true });
        res.status(200).json({
            success: true,
            data: {
                total,
                active,
                inactive: total - active,
                statusDistribution: statistics.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {}),
                conditionDistribution: conditionStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            }
        });
    }
    catch (error) {
        console.error('Error getting book copy statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
exports.getBookCopyStatistics = getBookCopyStatistics;
// Helper to adjust book available when BookCopy status changes
async function adjustBookAvailabilityOnStatusChange(bookId, oldStatus, newStatus) {
    const wasAvailable = oldStatus === 'available';
    const willBeAvailable = newStatus === 'available';
    if (wasAvailable && !willBeAvailable) {
        await Book_1.default.findByIdAndUpdate(bookId, { $inc: { available: -1 } });
    }
    else if (!wasAvailable && willBeAvailable) {
        await Book_1.default.findByIdAndUpdate(bookId, { $inc: { available: 1 } });
    }
}
// PUT /admin/book-copies/:id/mark-borrowed
const markBorrowed = async (req, res) => {
    try {
        const { id } = req.params;
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({ success: false, message: 'Bản sao không tồn tại' });
        }
        if (!bookCopy.isActive) {
            return res.status(400).json({ success: false, message: 'Bản sao đã bị vô hiệu hóa' });
        }
        if (bookCopy.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể mượn khi trạng thái là available' });
        }
        await adjustBookAvailabilityOnStatusChange(bookCopy.bookId, bookCopy.status, 'borrowed');
        bookCopy.status = 'borrowed';
        await bookCopy.save();
        await bookCopy.populate('bookId', 'title isbn');
        res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái: borrowed', data: { bookCopy } });
    }
    catch (error) {
        console.error('Error mark borrowed:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.markBorrowed = markBorrowed;
// PUT /admin/book-copies/:id/mark-returned
const markReturned = async (req, res) => {
    try {
        const { id } = req.params;
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({ success: false, message: 'Bản sao không tồn tại' });
        }
        if (!bookCopy.isActive) {
            return res.status(400).json({ success: false, message: 'Bản sao đã bị vô hiệu hóa' });
        }
        const oldStatus = bookCopy.status;
        if (oldStatus === 'available') {
            return res.status(400).json({ success: false, message: 'Bản sao đã ở trạng thái available' });
        }
        await adjustBookAvailabilityOnStatusChange(bookCopy.bookId, oldStatus, 'available');
        bookCopy.status = 'available';
        await bookCopy.save();
        await bookCopy.populate('bookId', 'title isbn');
        res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái: available', data: { bookCopy } });
    }
    catch (error) {
        console.error('Error mark returned:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.markReturned = markReturned;
// PUT /admin/book-copies/:id/mark-damaged
const markDamaged = async (req, res) => {
    try {
        const { id } = req.params;
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({ success: false, message: 'Bản sao không tồn tại' });
        }
        if (!bookCopy.isActive) {
            return res.status(400).json({ success: false, message: 'Bản sao đã bị vô hiệu hóa' });
        }
        const oldStatus = bookCopy.status;
        if (oldStatus === 'damaged') {
            return res.status(400).json({ success: false, message: 'Bản sao đã ở trạng thái damaged' });
        }
        await adjustBookAvailabilityOnStatusChange(bookCopy.bookId, oldStatus, 'damaged');
        bookCopy.status = 'damaged';
        await bookCopy.save();
        await bookCopy.populate('bookId', 'title isbn');
        res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái: damaged', data: { bookCopy } });
    }
    catch (error) {
        console.error('Error mark damaged:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.markDamaged = markDamaged;
// PUT /admin/book-copies/:id/mark-lost
const markLost = async (req, res) => {
    try {
        const { id } = req.params;
        const bookCopy = await BookCopy_1.default.findById(id);
        if (!bookCopy) {
            return res.status(404).json({ success: false, message: 'Bản sao không tồn tại' });
        }
        if (!bookCopy.isActive) {
            return res.status(400).json({ success: false, message: 'Bản sao đã bị vô hiệu hóa' });
        }
        const oldStatus = bookCopy.status;
        if (oldStatus === 'lost') {
            return res.status(400).json({ success: false, message: 'Bản sao đã ở trạng thái lost' });
        }
        await adjustBookAvailabilityOnStatusChange(bookCopy.bookId, oldStatus, 'lost');
        bookCopy.status = 'lost';
        await bookCopy.save();
        await bookCopy.populate('bookId', 'title isbn');
        res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái: lost', data: { bookCopy } });
    }
    catch (error) {
        console.error('Error mark lost:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.markLost = markLost;
//# sourceMappingURL=bookCopyController.js.map