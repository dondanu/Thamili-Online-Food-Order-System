const express = require('express');
const { 
  createOrder, 
  getUserOrders, 
  getOrder, 
  updateOrderStatusEndpoint,
  createOrderValidation 
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

router.post('/', createOrderValidation, createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatusEndpoint);

module.exports = router;