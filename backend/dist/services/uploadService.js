"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEbookDownloadUrl = exports.deleteEbookFromCloudinary = exports.uploadEbookBuffer = void 0;
const streamifier_1 = __importDefault(require("streamifier"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const EBOOK_FOLDER = process.env.CLOUDINARY_EBOOK_FOLDER || 'ebooks';
const DEFAULT_DOWNLOAD_TTL = Number(process.env.EBOOK_DOWNLOAD_TTL || 300); // seconds
const uploadEbookBuffer = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            resource_type: 'raw',
            type: 'authenticated',
            folder: EBOOK_FOLDER,
            format: options.format.toLowerCase(),
            use_filename: true,
            unique_filename: true,
            filename_override: options.fileName,
        }, (error, result) => {
            if (error || !result) {
                return reject(error);
            }
            resolve({
                publicId: result.public_id,
                url: result.secure_url,
                size: result.bytes,
                format: result.format,
            });
        });
        streamifier_1.default.createReadStream(fileBuffer).pipe(uploadStream);
    });
};
exports.uploadEbookBuffer = uploadEbookBuffer;
const deleteEbookFromCloudinary = async (publicId) => {
    await cloudinary_1.default.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated' });
};
exports.deleteEbookFromCloudinary = deleteEbookFromCloudinary;
const generateEbookDownloadUrl = (publicId, format, ttlSeconds = DEFAULT_DOWNLOAD_TTL) => {
    const expiresIn = ttlSeconds > 0 ? ttlSeconds : DEFAULT_DOWNLOAD_TTL;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const url = cloudinary_1.default.utils.private_download_url(publicId, format.toLowerCase(), {
        resource_type: 'raw',
        type: 'authenticated',
        expires_at: expiresAt,
    });
    return { url, expiresIn, expiresAt };
};
exports.generateEbookDownloadUrl = generateEbookDownloadUrl;
//# sourceMappingURL=uploadService.js.map