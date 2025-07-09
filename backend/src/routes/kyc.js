const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ message: 'KYC endpoint - to be implemented' });
});

module.exports = router; 