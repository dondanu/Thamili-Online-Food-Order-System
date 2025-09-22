const express = require('express');
const router = express.Router();

const {
   getMenuItems,
   getMenuCategories,
   getMenuItemById
} = require('../controllers/menuController.cjs');

// Public routes
router.get('/', getMenuItems);
router.get('/categories', getMenuCategories);
router.get('/:id', getMenuItemById);

module.exports = router;