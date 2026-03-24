/**
 * Migration Script: Generate slugs for existing books
 *
 * Usage: npx ts-node src/scripts/generateBookSlugs.ts
 */

import mongoose from 'mongoose';
import Book from '../models/Book';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/library';

async function generateSlugsForExistingBooks() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all books without slug
    const booksWithoutSlug = await Book.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`\n📚 Found ${booksWithoutSlug.length} books without slug`);

    if (booksWithoutSlug.length === 0) {
      console.log('✅ All books already have slugs!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    // Generate slug for each book
    for (const book of booksWithoutSlug) {
      try {
        // The pre-save middleware will auto-generate slug
        await book.save();
        successCount++;
        console.log(`✅ Generated slug for "${book.title}": ${book.slug}`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error for "${book.title}":`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📚 Total: ${booksWithoutSlug.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
generateSlugsForExistingBooks();
