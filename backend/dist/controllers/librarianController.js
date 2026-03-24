"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTags = exports.getAllPublishers = exports.getAllAuthors = void 0;
const Author_1 = __importDefault(require("../models/Author"));
const Publisher_1 = __importDefault(require("../models/Publisher"));
const Tag_1 = __importDefault(require("../models/Tag"));
// GET /librarian/authors - Lấy toàn bộ tác giả
const getAllAuthors = async (req, res) => {
    try {
        console.log('[getAllAuthors] req.user:', req.user);
        const authors = await Author_1.default.find({ isActive: true }).sort({ name: 1 });
        console.log(`[getAllAuthors] Found authors: ${authors.length}`);
        res.status(200).json({
            success: true,
            data: authors
        });
    }
    catch (err) {
        console.error('[getAllAuthors] ERROR:', err);
        if (err instanceof Error)
            console.error(err.stack);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAllAuthors = getAllAuthors;
// GET /librarian/publishers - Lấy toàn bộ nhà xuất bản
const getAllPublishers = async (req, res) => {
    try {
        console.log('[getAllPublishers] req.user:', req.user);
        const publishers = await Publisher_1.default.find({ isActive: true }).sort({ name: 1 });
        console.log(`[getAllPublishers] Found publishers: ${publishers.length}`);
        res.status(200).json({
            success: true,
            data: publishers
        });
    }
    catch (err) {
        console.error('[getAllPublishers] ERROR:', err);
        if (err instanceof Error)
            console.error(err.stack);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAllPublishers = getAllPublishers;
// GET /librarian/tags - Lấy toàn bộ tags
const getAllTags = async (req, res) => {
    try {
        console.log('[getAllTags] req.user:', req.user);
        const tags = await Tag_1.default.find({ isActive: true }).sort({ name: 1 });
        console.log(`[getAllTags] Found tags: ${tags.length}`);
        res.status(200).json({
            success: true,
            data: tags
        });
    }
    catch (err) {
        console.error('[getAllTags] ERROR:', err);
        if (err instanceof Error)
            console.error(err.stack);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAllTags = getAllTags;
//# sourceMappingURL=librarianController.js.map