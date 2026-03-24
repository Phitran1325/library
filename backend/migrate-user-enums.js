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
    const users = conn.connection.db.collection('users');

    const roleMap = { admin: 'Admin', librarian: 'Librarian', reader: 'Reader' };
    const statusMap = { active: 'Active', suspended: 'Suspended', banned: 'Banned' };

    const res = await users.updateMany(
      {
        $or: [
          { role: { $in: ['admin', 'librarian', 'reader'] } },
          { status: { $in: ['active', 'suspended', 'banned'] } }
        ]
      },
      [
        {
          $set: {
            role: {
              $let: {
                vars: { r: '$role' },
                in: { $ifNull: [ { $literal: null }, null ] }
              }
            }
          }
        }
      ]
    );

    // Fallback simple two-step updates (MongoDB doesn't support map easily in pipeline here)
    await users.updateMany({ role: 'admin' }, { $set: { role: 'Admin' } });
    await users.updateMany({ role: 'librarian' }, { $set: { role: 'Librarian' } });
    await users.updateMany({ role: 'reader' }, { $set: { role: 'Reader' } });

    await users.updateMany({ status: 'active' }, { $set: { status: 'Active' } });
    await users.updateMany({ status: 'suspended' }, { $set: { status: 'Suspended' } });
    await users.updateMany({ status: 'banned' }, { $set: { status: 'Banned' } });

    console.log('🎉 Migration completed');
  } catch (e) {
    console.error('❌ Migration error:', e);
  } finally {
    await conn.disconnect();
    console.log('🔌 Disconnected');
  }
}

main();
