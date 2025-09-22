const express = require('express');
const { 
  getMenuItems, 
  getCategories, 
  getMenuItem 
} = require('../controllers/menuController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All menu routes require authentication
router.use(authenticateToken);

router.get('/', getMenuItems);
router.get('/categories', getCategories);
router.get('/:id', getMenuItem);

module.exports = router;