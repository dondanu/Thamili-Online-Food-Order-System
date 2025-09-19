const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Order validation rules
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.id')
    .isInt({ min: 1 })
    .withMessage('Invalid menu item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
];

// Create new order
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items } = req.body;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Verify all menu items exist and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const [menuItems] = await connection.execute(
        'SELECT id, name, price, is_available FROM menu_items WHERE id = ?',
        [item.id]
      );

      if (menuItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Menu item with ID ${item.id} not found`
        });
      }

      const menuItem = menuItems[0];

      if (!menuItem.is_available) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Create order
    const estimatedTime = '25-30 minutes';
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total, estimated_time) VALUES (?, ?, ?)',
      [userId, total, estimatedTime]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const orderItem of orderItems) {
      await connection.execute(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, orderItem.menuItemId, orderItem.quantity, orderItem.price]
      );
    }

    await connection.commit();

    // Get complete order data
    const orderData = await getOrderById(orderId);

    // Simulate order status updates
    setTimeout(() => updateOrderStatus(orderId, 'confirmed'), 2000);
    setTimeout(() => updateOrderStatus(orderId, 'preparing'), 5000);
    setTimeout(() => updateOrderStatus(orderId, 'ready'), 15000);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: orderData
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    connection.release();
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', mi.id,
            'name', mi.name,
            'description', mi.description,
            'price', oi.price,
            'image', mi.image,
            'category', mi.category,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.user_id = ?
    `;

    let params = [userId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    // Parse JSON items
    const formattedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const orderData = await getOrderById(id, userId);

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order: orderData
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update order status (admin function - simplified for demo)
const updateOrderStatusEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await updateOrderStatus(id, status);

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to get order by ID
const getOrderById = async (orderId, userId = null) => {
  try {
    let query = `
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', mi.id,
            'name', mi.name,
            'description', mi.description,
            'price', oi.price,
            'image', mi.image,
            'category', mi.category,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ?
    `;

    let params = [orderId];

    if (userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }

    query += ' GROUP BY o.id';

    const [orders] = await pool.execute(query, params);

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    return {
      ...order,
      items: JSON.parse(order.items)
    };

  } catch (error) {
    console.error('Get order by ID error:', error);
    return null;
  }
};

// Helper function to update order status
const updateOrderStatus = async (orderId, status) => {
  try {
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );
  } catch (error) {
    console.error('Update order status helper error:', error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatusEndpoint,
  createOrderValidation
};