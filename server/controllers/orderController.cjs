const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database.cjs');

// Order validation rules
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menuItemId').isInt({ min: 1 }).withMessage('Invalid menu item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress').trim().isLength({ min: 10 }).withMessage('Delivery address is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required')
];

// Create new order
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, deliveryAddress, phone, notes } = req.body;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Validate menu items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const [menuItems] = await connection.execute(
        'SELECT id, name, price, is_available FROM menu_items WHERE id = ?',
        [item.menuItemId]
      );

      if (menuItems.length === 0 || !menuItems[0].is_available) {
        await connection.rollback();
        return res.status(400).json({
          message: `Menu item with ID ${item.menuItemId} is not available`
        });
      }

      const menuItem = menuItems[0];
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        total: itemTotal
      });
    }

    // Create order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_amount, delivery_address, phone, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, totalAmount, deliveryAddress, phone, notes || null]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of validatedItems) {
      await connection.execute(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.menuItemId, item.quantity, item.price]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: orderId,
        totalAmount,
        status: 'pending',
        items: validatedItems,
        deliveryAddress,
        phone,
        notes
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Failed to create order'
    });
  } finally {
    connection.release();
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'menuItemId', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.quantity * oi.price
          )
        ) as items
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

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.execute(query, params);

    // Parse JSON items
    const formattedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));

    res.json({
      orders: formattedOrders,
      total: formattedOrders.length
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      message: 'Failed to fetch orders'
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'menuItemId', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.quantity * oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ? AND o.user_id = ?
      GROUP BY o.id
    `, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    const order = {
      ...orders[0],
      items: JSON.parse(orders[0].items)
    };

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      message: 'Failed to fetch order'
    });
  }
};

// Update order status (admin only - simplified for demo)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid order status'
      });
    }

    const [result] = await pool.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    res.json({
      message: 'Order status updated successfully',
      status
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      message: 'Failed to update order status'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  createOrderValidation
};