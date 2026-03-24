import bcrypt from 'bcryptjs';
import User from '../models/User';

export async function seedAdminUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@library.local', role: 'Admin' });
    
    if (existingAdmin) {
      return; // Admin already exists
    }

    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    const adminUser = new User({
      email: 'admin@library.local',
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'Library Administrator',
      role: 'Admin',
      status: 'Active',
      isActive: true,
      canBorrow: true,
      walletBalance: 0,
      totalSpent: 0,
    });

    await adminUser.save();
    console.log('✅ Seeded admin user: admin@library.local / Admin@123456');
  } catch (err) {
    console.error('🚨 Failed to seed admin user:', err);
  }
}
