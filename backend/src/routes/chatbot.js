const express = require('express');
const { optionalAuth, extractUserContext, rateLimitMessages } = require('../chat-bot/middleware/auth');
const chatbotRouter = require('../chat-bot/index');

const router = express.Router();

// Apply middleware
router.use(optionalAuth);
router.use(extractUserContext);
router.use(rateLimitMessages);

// Mount chatbot routes
router.use('/', chatbotRouter);

module.exports = router;