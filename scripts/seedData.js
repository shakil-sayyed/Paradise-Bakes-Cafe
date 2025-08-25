const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Menu = require('../models/Menu');
const User = require('../models/User');

const menuData = [
  // Cakes
  {
    category: 'cake',
    variety: 'dark_chocolate',
    name: 'Dark Chocolate Cake',
    description: 'Rich and decadent dark chocolate cake with chocolate ganache',
    ingredients: ['Dark chocolate', 'Flour', 'Sugar', 'Eggs', 'Butter', 'Cocoa powder'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 450,
    preparation_time: 60,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['chocolate', 'popular', 'birthday'],
    serving_size: '1 kg',
    best_seller: true
  },
  {
    category: 'cake',
    variety: 'black_forest',
    name: 'Black Forest Cake',
    description: 'Classic black forest cake with cherries and whipped cream',
    ingredients: ['Chocolate', 'Cherries', 'Whipped cream', 'Flour', 'Sugar', 'Eggs'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 500,
    preparation_time: 75,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['chocolate', 'cherry', 'classic'],
    serving_size: '1 kg',
    best_seller: true
  },
  {
    category: 'cake',
    variety: 'strawberry',
    name: 'Strawberry Cake',
    description: 'Fresh strawberry cake with strawberry cream filling',
    ingredients: ['Strawberries', 'Flour', 'Sugar', 'Eggs', 'Butter', 'Cream'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 480,
    preparation_time: 60,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['strawberry', 'fruit', 'fresh'],
    serving_size: '1 kg'
  },
  {
    category: 'cake',
    variety: 'butterscotch',
    name: 'Butterscotch Cake',
    description: 'Delicious butterscotch cake with caramel sauce',
    ingredients: ['Butterscotch', 'Flour', 'Sugar', 'Eggs', 'Butter', 'Caramel'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 420,
    preparation_time: 60,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['butterscotch', 'caramel', 'sweet'],
    serving_size: '1 kg'
  },
  {
    category: 'cake',
    variety: 'pineapple',
    name: 'Pineapple Cake',
    description: 'Fresh pineapple cake with pineapple cream',
    ingredients: ['Pineapple', 'Flour', 'Sugar', 'Eggs', 'Butter', 'Cream'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 460,
    preparation_time: 60,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['pineapple', 'fruit', 'tropical'],
    serving_size: '1 kg'
  },
  {
    category: 'cake',
    variety: 'rasmalai',
    name: 'Rasmalai Cake',
    description: 'Traditional rasmalai flavored cake with cardamom',
    ingredients: ['Milk', 'Sugar', 'Cardamom', 'Flour', 'Eggs', 'Saffron'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 520,
    preparation_time: 90,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['indian', 'traditional', 'cardamom'],
    serving_size: '1 kg',
    best_seller: true
  },

  // Pizzas
  {
    category: 'pizza',
    variety: 'margherita',
    name: 'Margherita Pizza',
    description: 'Classic margherita pizza with tomato sauce and mozzarella',
    ingredients: ['Pizza base', 'Tomato sauce', 'Mozzarella cheese', 'Basil', 'Olive oil'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 180,
    preparation_time: 25,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['classic', 'cheese', 'tomato'],
    serving_size: '10 inch',
    best_seller: true
  },
  {
    category: 'pizza',
    variety: 'farmhouse',
    name: 'Farmhouse Pizza',
    description: 'Loaded with fresh vegetables and cheese',
    ingredients: ['Pizza base', 'Tomato sauce', 'Cheese', 'Bell peppers', 'Onions', 'Mushrooms', 'Olives'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 220,
    preparation_time: 30,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['vegetables', 'loaded', 'fresh'],
    serving_size: '10 inch',
    best_seller: true
  },
  {
    category: 'pizza',
    variety: 'paneer',
    name: 'Paneer Pizza',
    description: 'Spicy paneer pizza with Indian spices',
    ingredients: ['Pizza base', 'Tomato sauce', 'Paneer', 'Onions', 'Bell peppers', 'Spices'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 250,
    preparation_time: 30,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['paneer', 'indian', 'spicy'],
    serving_size: '10 inch'
  },
  {
    category: 'pizza',
    variety: 'corn',
    name: 'Sweet Corn Pizza',
    description: 'Sweet corn pizza with cheese and herbs',
    ingredients: ['Pizza base', 'Tomato sauce', 'Sweet corn', 'Cheese', 'Herbs'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 200,
    preparation_time: 25,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['corn', 'sweet', 'herbs'],
    serving_size: '10 inch'
  },

  // Burgers
  {
    category: 'burger',
    variety: 'paneer_patty',
    name: 'Paneer Patty Burger',
    description: 'Spicy paneer patty burger with fresh vegetables',
    ingredients: ['Burger bun', 'Paneer patty', 'Lettuce', 'Tomato', 'Onion', 'Mayonnaise'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 120,
    preparation_time: 15,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['paneer', 'spicy', 'fresh'],
    serving_size: '1 piece',
    best_seller: true
  },
  {
    category: 'burger',
    variety: 'cheese',
    name: 'Cheese Burger',
    description: 'Classic cheese burger with melted cheese',
    ingredients: ['Burger bun', 'Cheese patty', 'Lettuce', 'Tomato', 'Onion', 'Cheese slice'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 100,
    preparation_time: 12,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['cheese', 'classic', 'melted'],
    serving_size: '1 piece'
  },

  // Sandwiches
  {
    category: 'sandwich',
    variety: 'grilled',
    name: 'Grilled Cheese Sandwich',
    description: 'Classic grilled cheese sandwich with butter',
    ingredients: ['Bread', 'Cheese', 'Butter'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 80,
    preparation_time: 10,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['grilled', 'cheese', 'classic'],
    serving_size: '2 pieces',
    best_seller: true
  },
  {
    category: 'sandwich',
    variety: 'bombay',
    name: 'Bombay Sandwich',
    description: 'Mumbai style sandwich with chutney and vegetables',
    ingredients: ['Bread', 'Potato', 'Cucumber', 'Tomato', 'Chutney', 'Butter'],
    allergens: ['Gluten'],
    base_price: 90,
    preparation_time: 12,
    availability: true,
    is_featured: false,
    is_vegan: true,
    is_gluten_free: false,
    tags: ['bombay', 'mumbai', 'chutney'],
    serving_size: '2 pieces'
  },
  {
    category: 'sandwich',
    variety: 'cheese_chilli',
    name: 'Cheese Chilli Toast',
    description: 'Spicy cheese chilli toast',
    ingredients: ['Bread', 'Cheese', 'Green chillies', 'Butter'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 85,
    preparation_time: 8,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['cheese', 'chilli', 'spicy'],
    serving_size: '2 pieces'
  },
  {
    category: 'sandwich',
    variety: 'paneer',
    name: 'Paneer Sandwich',
    description: 'Paneer sandwich with mint chutney',
    ingredients: ['Bread', 'Paneer', 'Mint chutney', 'Onion', 'Tomato'],
    allergens: ['Gluten', 'Dairy'],
    base_price: 95,
    preparation_time: 12,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['paneer', 'mint', 'fresh'],
    serving_size: '2 pieces'
  },

  // Pastries
  {
    category: 'pastry',
    variety: 'chocolate',
    name: 'Chocolate Pastry',
    description: 'Rich chocolate pastry with chocolate ganache',
    ingredients: ['Flour', 'Chocolate', 'Sugar', 'Eggs', 'Butter', 'Cream'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 60,
    preparation_time: 45,
    availability: true,
    is_featured: true,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['chocolate', 'rich', 'ganache'],
    serving_size: '1 piece',
    best_seller: true
  },
  {
    category: 'pastry',
    variety: 'pineapple',
    name: 'Pineapple Pastry',
    description: 'Fresh pineapple pastry with cream',
    ingredients: ['Flour', 'Pineapple', 'Sugar', 'Eggs', 'Butter', 'Cream'],
    allergens: ['Gluten', 'Eggs', 'Dairy'],
    base_price: 55,
    preparation_time: 45,
    availability: true,
    is_featured: false,
    is_vegan: false,
    is_gluten_free: false,
    tags: ['pineapple', 'fruit', 'fresh'],
    serving_size: '1 piece'
  }
];

async function seedData() {
  try {
    console.log('🌱 Seeding Paradise Bakes & Cafe database...');

    // Connect to MongoDB
    await mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/${process.env.DB_NAME}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: process.env.DB_USER,
      pass: process.env.DB_PASSWORD,
      authSource: 'admin'
    });

    console.log('✅ Connected to MongoDB successfully');

    // Clear existing menu data
    console.log('🧹 Clearing existing menu data...');
    await Menu.deleteMany({});
    console.log('✅ Existing menu data cleared');

    // Insert menu data
    console.log('📝 Inserting menu data...');
    const createdMenuItems = await Menu.insertMany(menuData);
    console.log(`✅ ${createdMenuItems.length} menu items created successfully`);

    // Create additional staff users
    console.log('👥 Creating additional staff users...');
    
    const staffUsers = [
      {
        username: 'aslam',
        password: 'Paradise123!',
        name: 'Aslam',
        email: 'aslam@paradisebakescafe.com',
        role: 'manager',
        isActive: true
      },
      {
        username: 'imran',
        password: 'Paradise123!',
        name: 'Imran',
        email: 'imran@paradisebakescafe.com',
        role: 'staff',
        isActive: true
      }
    ];

    for (const userData of staffUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ User ${userData.username} created`);
      } else {
        console.log(`✅ User ${userData.username} already exists`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${createdMenuItems.length} menu items created`);
    console.log(`- Staff users created/verified`);
    console.log('\n🍰 Menu Categories:');
    const categories = [...new Set(createdMenuItems.map(item => item.category))];
    categories.forEach(category => {
      const count = createdMenuItems.filter(item => item.category === category).length;
      console.log(`  - ${category}: ${count} items`);
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
