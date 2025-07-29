/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: recipients - handles backend functionality
 */

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Recipients endpoint - to be implemented' });
});

module.exports = router; 