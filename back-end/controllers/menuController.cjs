const { pool } = require('../config/database.cjs');

// Get all menu items
const getMenuItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = 'SELECT * FROM menu_items WHERE is_available = true';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY category, name';

    const [menuItems] = await pool.execute(query, params);

    res.json({
      menuItems,
      total: menuItems.length
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      message: 'Failed to fetch menu items'
    });
  }
};

// Get menu item by ID
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const [menuItems] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ? AND is_available = true',
      [id]
    );

    if (menuItems.length === 0) {
      return res.status(404).json({
        message: 'Menu item not found'
      });
    }

    res.json({
      menuItem: menuItems[0]
    });

  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      message: 'Failed to fetch menu item'
    });
  }
};

// Get menu categories
const getMenuCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM menu_items WHERE is_available = true ORDER BY category'
    );

    res.json({
      categories: categories.map(row => row.category)
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Failed to fetch categories'
    });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  getMenuCategories
};