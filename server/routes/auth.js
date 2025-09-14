const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  registerValidation, 
  loginValidation 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', authenticateToken, getMe);

module.exports = router;