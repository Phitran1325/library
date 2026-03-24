/**
 * Check if books have slugs in database
 * Usage: npx ts-node src/scripts/checkBookSlugs.ts
 */

import mongoose from 'mongoose';
import Book from '../models/Book';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/library';

async function checkBookSlugs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total books
    const totalBooks = await Book.countDocuments();
    console.log(`📚 Total books in database: ${totalBooks}`);

    // Count books with slug
    const booksWithSlug = await Book.countDocuments({ slug: { $ne: null } });
    console.log(`✅ Books with slug: ${booksWithSlug}`);

    // Count books without slug
    const booksWithoutSlug = totalBooks - booksWithSlug;
    console.log(`❌ Books without slug: ${booksWithoutSlug}\n`);

    // Show sample books
    console.log('📖 Sample books:');
    const sampleBooks = await Book.find().limit(5).select('title slug');
    sampleBooks.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
      console.log(`      Slug: ${book.slug || '(no slug)'}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBookSlugs();
