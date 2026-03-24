import { Request, Response } from 'express';
import Author from '../models/Author';
import Publisher from '../models/Publisher';
import Tag from '../models/Tag';
import { uploadCoverImageBuffer } from '../services/uploadService';

interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

// GET /librarian/authors - Lấy toàn bộ tác giả
export const getAllAuthors = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[getAllAuthors] req.user:', req.user);

    const authors = await Author.find({ isActive: true }).sort({ name: 1 });
    console.log(`[getAllAuthors] Found authors: ${authors.length}`);

    res.status(200).json({
      success: true,
      data: authors
    });
  } catch (err) {
    console.error('[getAllAuthors] ERROR:', err);
    if (err instanceof Error) console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /librarian/publishers - Lấy toàn bộ nhà xuất bản
export const getAllPublishers = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[getAllPublishers] req.user:', req.user);

    const publishers = await Publisher.find({ isActive: true }).sort({ name: 1 });
    console.log(`[getAllPublishers] Found publishers: ${publishers.length}`);

    res.status(200).json({
      success: true,
      data: publishers
    });
  } catch (err) {
    console.error('[getAllPublishers] ERROR:', err);
    if (err instanceof Error) console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /librarian/tags - Lấy toàn bộ tags
export const getAllTags = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[getAllTags] req.user:', req.user);

    const tags = await Tag.find({ isActive: true }).sort({ name: 1 });
    console.log(`[getAllTags] Found tags: ${tags.length}`);

    res.status(200).json({
      success: true,
      data: tags
    });
  } catch (err) {
    console.error('[getAllTags] ERROR:', err);
    if (err instanceof Error) console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /librarian/upload-image - Upload ảnh bìa sách
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[uploadImage] req.user:', req.user);
    console.log('[uploadImage] req.file:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy file ảnh'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadCoverImageBuffer(req.file.buffer, {
      fileName: req.file.originalname
    });

    console.log('[uploadImage] Upload success:', uploadResult);

    res.status(200).json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.size
      }
    });
  } catch (err) {
    console.error('[uploadImage] ERROR:', err);
    if (err instanceof Error) console.error(err.stack);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Lỗi khi upload ảnh'
    });
  }
};
