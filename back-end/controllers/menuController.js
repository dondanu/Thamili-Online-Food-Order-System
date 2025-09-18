const { pool } = require('../config/database');

// Get all menu items
const getMenuItems = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM menu_items WHERE is_available = TRUE';
    let params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, name';

    const [menuItems] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        menuItems
      }
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get menu categories
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM menu_items WHERE is_available = TRUE ORDER BY category'
    );

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => cat.category)
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [menuItems] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ? AND is_available = TRUE',
      [id]
    );

    if (menuItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: {
        menuItem: menuItems[0]
      }
    });

  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getMenuItems,
  getCategories,
  getMenuItem
};