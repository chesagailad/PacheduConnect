/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: admin - handles backend functionality
 */

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Admin endpoint - to be implemented' });
});

module.exports = router; 