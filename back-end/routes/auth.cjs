const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser,
  registerValidation, 
  loginValidation 
} = require('../controllers/authController.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;