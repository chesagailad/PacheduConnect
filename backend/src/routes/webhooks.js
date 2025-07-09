const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  res.json({ message: 'Webhooks endpoint - to be implemented' });
});

module.exports = router; 