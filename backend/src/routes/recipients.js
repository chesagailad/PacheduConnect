const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Recipients endpoint - to be implemented' });
});

module.exports = router; 