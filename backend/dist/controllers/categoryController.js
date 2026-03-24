"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const toSlug = (name) => name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
const createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const slug = toSlug(name);
        const existing = await Category_1.default.findOne({ $or: [{ name: name.trim() }, { slug }] });
        if (existing) {
            return res.status(409).json({ message: 'Category already exists' });
        }
        const category = await Category_1.default.create({ name: name.trim(), slug, description, isActive });
        res.status(201).json(category);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createCategory = createCategory;
const getCategories = async (_req, res) => {
    try {
        const categories = await Category_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(categories);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCategories = getCategories;
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCategoryById = getCategoryById;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const data = { description, isActive };
        if (typeof name === 'string' && name.trim()) {
            data.name = name.trim();
            data.slug = toSlug(name);
        }
        const existsByName = data.name
            ? await Category_1.default.findOne({ name: data.name, _id: { $ne: id } })
            : null;
        if (existsByName) {
            return res.status(409).json({ message: 'Category name already in use' });
        }
        const category = await Category_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map