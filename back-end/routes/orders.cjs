const express = require('express');
const { 
  createOrder, 
  getUserOrders, 
  getOrderById,
  updateOrderStatus,
  createOrderValidation 
} = require('../controllers/orderController.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Order routes
router.post('/', createOrderValidation, createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;