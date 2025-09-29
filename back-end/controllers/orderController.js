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
        o.id AS order_id,
        o.user_id,
        o.total,
        o.status,
        o.estimated_time,
        o.created_at,
        o.updated_at,
        mi.id AS item_id,
        mi.name AS item_name,
        mi.description AS item_description,
        mi.image AS item_image,
        mi.category AS item_category,
        oi.price AS item_price,
        oi.quantity AS item_quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC, o.id DESC';

    const [rows] = await pool.execute(query, params);

    // Aggregate rows into orders with items array without relying on MySQL JSON functions
    const orderIdToOrder = new Map();
    for (const row of rows) {
      if (!orderIdToOrder.has(row.order_id)) {
        orderIdToOrder.set(row.order_id, {
          id: row.order_id,
          user_id: row.user_id,
          total: row.total,
          status: row.status,
          estimated_time: row.estimated_time,
          created_at: row.created_at,
          updated_at: row.updated_at,
          items: []
        });
      }
      // Only push item if present (LEFT JOIN may yield nulls when there are no items)
      if (row.item_id) {
        orderIdToOrder.get(row.order_id).items.push({
          id: row.item_id,
          name: row.item_name,
          description: row.item_description,
          price: row.item_price,
          image: row.item_image,
          category: row.item_category,
          quantity: row.item_quantity
        });
      }
    }

    const formattedOrders = Array.from(orderIdToOrder.values());

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
        o.id AS order_id,
        o.user_id,
        o.total,
        o.status,
        o.estimated_time,
        o.created_at,
        o.updated_at,
        mi.id AS item_id,
        mi.name AS item_name,
        mi.description AS item_description,
        mi.image AS item_image,
        mi.category AS item_category,
        oi.price AS item_price,
        oi.quantity AS item_quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ?
    `;

    const params = [orderId];
    if (userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }

    const [rows] = await pool.execute(query, params);
    if (rows.length === 0) {
      return null;
    }

    const base = rows[0];
    const order = {
      id: base.order_id,
      user_id: base.user_id,
      total: base.total,
      status: base.status,
      estimated_time: base.estimated_time,
      created_at: base.created_at,
      updated_at: base.updated_at,
      items: []
    };

    for (const row of rows) {
      if (row.item_id) {
        order.items.push({
          id: row.item_id,
          name: row.item_name,
          description: row.item_description,
          price: row.item_price,
          image: row.item_image,
          category: row.item_category,
          quantity: row.item_quantity
        });
      }
    }

    return order;

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