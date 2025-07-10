const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getSequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const auth = require('../middleware/auth');
const smsService = require('../services/smsService');
const router = express.Router();

// In-memory storage for OTP (in production, use Redis)
const otpStore = new Map();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    
    const User = createUserModel(getSequelize());
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Prepare user data, only include phoneNumber if it's not empty
    const userData = {
      name,
      email,
      passwordHash,
    };
    
    if (phoneNumber && phoneNumber.trim() !== '') {
      userData.phoneNumber = phoneNumber.trim();
    }

    const user = await User.create(userData);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const User = createUserModel(getSequelize());
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'name', 'email', 'passwordHash', 'phoneNumber']
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// Send OTP for password reset
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const User = createUserModel(getSequelize());
    const user = await User.findOne({ where: { email } });
    
    if (!user || !user.phoneNumber) {
      // Don't reveal if user exists or has phone number
      return res.status(200).json({ 
        message: 'If a user with this email exists and has a phone number, an OTP will be sent.',
        maskedPhone: '***-***-****'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.set(user.id, {
      otp,
      expiry: otpExpiry,
      attempts: 0
    });

    // Send SMS via SMSPortal
    try {
      await smsService.sendTestOTP(user.phoneNumber, otp);
      
      // Mask phone number for security
      const maskedPhone = user.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      
      res.json({
        message: 'OTP sent successfully',
        maskedPhone: maskedPhone.replace(/\d(?=\d{4})/g, '*')
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    const User = createUserModel(getSequelize());
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid request.' });
    }

    const storedOTP = otpStore.get(user.id);
    if (!storedOTP) {
      return res.status(400).json({ message: 'OTP not found or expired.' });
    }

    if (Date.now() > storedOTP.expiry) {
      otpStore.delete(user.id);
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    if (storedOTP.attempts >= 3) {
      otpStore.delete(user.id);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      otpStore.set(user.id, storedOTP);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ passwordHash });

    // Clear OTP
    otpStore.delete(user.id);

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed.' });
  }
});

// Legacy email-based password reset (for backward compatibility)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const User = createUserModel(getSequelize());
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(200).json({ message: 'If a user with this email exists, a reset link will be sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

    // Store reset token (in production, use Redis)
    otpStore.set(`reset_${user.id}`, {
      token: resetToken,
      expiry: resetExpiry
    });

    // In development, log the token
    if (process.env.NODE_ENV === 'development') {
      console.log(`Reset token for ${email}: ${resetToken}`);
    }

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request.' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data.' });
  }
});

module.exports = router; 