const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Menu = require('../models/Menu');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Paradise Bakes & Cafe database...');

    // Connect to MongoDB
    await mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/${process.env.DB_NAME}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: process.env.DB_USER,
      pass: process.env.DB_PASSWORD,
      authSource: 'admin'
    });

    console.log('✅ Connected to MongoDB successfully');

    // Create indexes
    console.log('📊 Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });

    // Menu indexes
    await Menu.collection.createIndex({ category: 1, variety: 1 });
    await Menu.collection.createIndex({ availability: 1, is_featured: 1 });
    await Menu.collection.createIndex({ best_seller: 1 });
    await Menu.collection.createIndex({ tags: 1 });
    await Menu.collection.createIndex({ base_price: 1 });

    console.log('✅ Database indexes created successfully');

    // Check if admin user exists
    const adminUser = await User.findOne({ username: process.env.ADMIN_USERNAME });
    
    if (!adminUser) {
      console.log('👤 Creating admin user...');
      
      const admin = new User({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        name: 'Shakil Sayyed',
        email: 'shakil@paradisebakescafe.com',
        role: 'admin',
        isActive: true
      });

      await admin.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
