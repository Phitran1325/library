"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStaff = exports.adminMiddleware = exports.roleMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BlacklistedToken_1 = __importDefault(require("../models/BlacklistedToken"));
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        BlacklistedToken_1.default.findOne({ token })
            .then((found) => {
            if (found) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
            req.user = decoded;
            next();
        })
            .catch(() => {
            return res.status(401).json({ message: 'Unauthorized' });
        });
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        const role = (req.user?.role || '').toString();
        const normalizedRoles = roles.reduce((acc, r) => {
            acc.push(r);
            acc.push(r.toLowerCase());
            return acc;
        }, []);
        if (!normalizedRoles.includes(role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
const adminMiddleware = (req, res, next) => {
    const role = (req.user?.role || '').toString();
    if (role !== 'Admin' && role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
const requireStaff = (req, res, next) => {
    const role = (req.user?.role || '').toString().trim();
    const normalizedRole = role.toLowerCase();
    // Debug logging
    console.log('requireStaff middleware:', {
        role,
        normalizedRole,
        user: req.user
    });
    if (normalizedRole !== 'admin' && normalizedRole !== 'librarian') {
        console.error('Access denied - not staff:', { role, normalizedRole });
        return res.status(403).json({
            success: false,
            message: 'Chỉ Admin/Librarian mới có quyền thực hiện chức năng này'
        });
    }
    next();
};
exports.requireStaff = requireStaff;
//# sourceMappingURL=auth.js.map