const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_order_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Debug: Log the database configuration (without password)
console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password ? '***' : 'empty',
  database: dbConfig.database
});

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create menu_items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
        delivery_address TEXT,
        phone VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create order_items table
    await pool.execute(`
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
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM menu_items');
    if (rows[0].count === 0) {
      const sampleItems = [
        ['Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, 'Pizza', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'],
        ['Pepperoni Pizza', 'Pizza with pepperoni, mozzarella, and tomato sauce', 14.99, 'Pizza', 'https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg'],
        ['Chicken Burger', 'Grilled chicken breast with lettuce, tomato, and mayo', 10.99, 'Burgers', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg'],
        ['Beef Burger', 'Juicy beef patty with cheese, lettuce, and tomato', 11.99, 'Burgers', 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg'],
        ['Caesar Salad', 'Fresh romaine lettuce with Caesar dressing and croutons', 8.99, 'Salads', 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg'],
        ['Greek Salad', 'Mixed greens with feta cheese, olives, and Greek dressing', 9.99, 'Salads', 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg'],
        ['Coca Cola', 'Refreshing cola drink', 2.99, 'Beverages', 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg'],
        ['Orange Juice', 'Fresh squeezed orange juice', 3.99, 'Beverages', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg']
      ];

      for (const item of sampleItems) {
        await pool.execute(
          'INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
          item
        );
      }
      console.log('✅ Sample menu items inserted');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};