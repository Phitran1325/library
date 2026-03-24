const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file');
    process.exit(1);
  }
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');
  try {
    const User = require('./dist/models/User').default;
    const res = await User.updateOne(
      { email: 'admin@library.com' },
      { $set: { role: 'Admin', status: 'Active' } }
    );
    const user = await User.findOne({ email: 'admin@library.com' }).lean();
    console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount);
    console.log('User role:', user && user.role, 'status:', user && user.status);
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await conn.disconnect();
    console.log('🔌 Disconnected');
  }
}

main();
