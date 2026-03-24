const mongoose = require('mongoose');
require('dotenv').config();

// Models from dist
const Author = require('./dist/models/Author').default;
const Publisher = require('./dist/models/Publisher').default;
const Book = require('./dist/models/Book').default;

// Controllers from dist
const authorController = require('./dist/controllers/authorController');
const publisherController = require('./dist/controllers/publisherController');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  try {
    // 1) Tạo Author, Publisher
    const author = await new Author({ name: 'Controller Test Author', nationality: 'VN', isActive: true }).save();
    const publisher = await new Publisher({ name: 'Controller Test Publisher', address: 'HN', isActive: true }).save();
    console.log('🆕 Created author/publisher');

    // 2) Tạo Book tham chiếu
    const book = await new Book({
      title: 'Controller Test Book',
      authorId: author._id,
      publisherId: publisher._id,
      category: 'Văn học',
      language: 'Vietnamese',
      rentalPrice: 10000,
      stock: 1,
      available: 1,
      isActive: true
    }).save();
    console.log('📚 Created book that references author/publisher');

    // 3) Thử xóa Author (kỳ vọng 400)
    const reqDelAuthor1 = { params: { id: String(author._id) } };
    const resDelAuthor1 = createMockRes();
    await authorController.deleteAuthor(reqDelAuthor1, resDelAuthor1);
    console.log('🧪 deleteAuthor with referenced books ->', resDelAuthor1.statusCode, resDelAuthor1.body && resDelAuthor1.body.message);

    // 4) Thử xóa Publisher (kỳ vọng 400)
    const reqDelPublisher1 = { params: { id: String(publisher._id) } };
    const resDelPublisher1 = createMockRes();
    await publisherController.deletePublisher(reqDelPublisher1, resDelPublisher1);
    console.log('🧪 deletePublisher with referenced books ->', resDelPublisher1.statusCode, resDelPublisher1.body && resDelPublisher1.body.message);

    // 5) Xóa book
    await Book.deleteOne({ _id: book._id });
    console.log('🗑️ Deleted book');

    // 6) Thử xóa Author (kỳ vọng 200)
    const reqDelAuthor2 = { params: { id: String(author._id) } };
    const resDelAuthor2 = createMockRes();
    await authorController.deleteAuthor(reqDelAuthor2, resDelAuthor2);
    console.log('🧪 deleteAuthor after removing books ->', resDelAuthor2.statusCode);

    // 7) Thử xóa Publisher (kỳ vọng 200)
    const reqDelPublisher2 = { params: { id: String(publisher._id) } };
    const resDelPublisher2 = createMockRes();
    await publisherController.deletePublisher(reqDelPublisher2, resDelPublisher2);
    console.log('🧪 deletePublisher after removing books ->', resDelPublisher2.statusCode);

  } catch (e) {
    console.error('❌ Test error:', e);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

main();
