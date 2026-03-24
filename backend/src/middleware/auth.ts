import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import BlacklistedToken from '../models/BlacklistedToken';

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const found = await BlacklistedToken.findOne({ token });
    if (found) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = (req.user?.role || '').toString();
    const normalizedRoles = roles.reduce((acc: string[], r) => {
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

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = (req.user?.role || '').toString();
  if (role !== 'Admin' && role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
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