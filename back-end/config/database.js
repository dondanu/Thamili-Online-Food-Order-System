const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_order_system',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create menu_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
        estimated_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
      )
    `);

    // Insert sample menu items if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM menu_items');
    if (rows[0].count === 0) {
      const sampleItems = [
        ['Classic Beef Burger', 'Juicy beef patty with lettuce, tomato, onion, and our special sauce', 12.99, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', 'Burgers'],
        ['Chicken Deluxe', 'Grilled chicken breast with avocado, bacon, and ranch dressing', 14.99, 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg', 'Burgers'],
        ['Veggie Burger', 'Plant-based patty with fresh vegetables and herb mayo', 11.99, 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg', 'Burgers'],
        ['Margherita Pizza', 'Classic tomato sauce, mozzarella, and fresh basil', 16.99, 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg', 'Pizza'],
        ['Pepperoni Supreme', 'Loaded with pepperoni, mozzarella, and Italian herbs', 19.99, 'https://images.pexels.com/photos/365459/pexels-photo-365459.jpeg', 'Pizza'],
        ['Mediterranean Delight', 'Olives, feta cheese, tomatoes, and oregano', 18.99, 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg', 'Pizza'],
        ['Chicken Pad Thai', 'Stir-fried noodles with chicken, bean sprouts, and peanut sauce', 13.99, 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg', 'Asian'],
        ['Beef Teriyaki Bowl', 'Tender beef with steamed rice and teriyaki glaze', 15.99, 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg', 'Asian'],
        ['Vegetable Spring Rolls', 'Crispy rolls filled with fresh vegetables, served with sweet sauce', 8.99, 'https://images.pexels.com/photos/4518844/pexels-photo-4518844.jpeg', 'Asian'],
        ['Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 7.99, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg', 'Desserts'],
        ['Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 6.99, 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg', 'Desserts'],
        ['Fresh Berry Cheesecake', 'Creamy cheesecake topped with mixed fresh berries', 8.99, 'https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg', 'Desserts']
      ];

      for (const item of sampleItems) {
        await connection.execute(
          'INSERT INTO menu_items (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)',
          item
        );
      }
      console.log('✅ Sample menu items inserted');
    }

    connection.release();
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};