const express = require('express');
const { processMessage } = require('./services/nlpService');
const { getSessionById, createSession, updateSession, getSessionsByUserId } = require('./services/sessionService');
const { getExchangeRate } = require('./services/rateService');
const { getTransactionStatus } = require('./services/transactionService');
const { getUserByEmail } = require('./services/userService');
const auth = require('./middleware/auth');
const analyticsService = require('./services/analyticsService');
const openaiService = require('./services/openaiService');
const languageService = require('./services/languageService');
const mediaService = require('./services/mediaService');
const authService = require('./services/authService');
const logger = require('../../utils/logger');

const router = express.Router();

// Chat endpoint
router.post('/message', async (req, res) => {
  const startTime = Date.now();
  let session = null;
  
  try {
    const { message, userId, platform = 'web', language = 'en' } = req.body;

    // Input validation
    if (!message || typeof message !== 'string') {
      logger.warn('Invalid message format received', { 
        userId, 
        platform, 
        messageType: typeof message,
        messageLength: message?.length 
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required and must be a string' 
      });
    }

    if (!userId) {
      logger.warn('Missing userId in chatbot request', { platform });
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    // Get or create session
    let userSessions = await getSessionsByUserId(userId);
    if (userSessions.length === 0) {
      session = await createSession(userId, platform);
      logger.info('New chatbot session created', { 
        sessionId: session.id, 
        userId, 
        platform 
      });
    } else {
      session = userSessions[0]; // Use most recent session
      logger.debug('Using existing chatbot session', { 
        sessionId: session.id, 
        userId, 
        platform 
      });
    }

    // Detect language if not provided
    let detectedLanguage = language;
    if (language === 'auto') {
      const languageResult = languageService.detectLanguage(message);
      detectedLanguage = languageResult.language;
    }

    // Process message with OpenAI if available, otherwise use basic NLP
    let nlpResult;
    const openaiAvailable = await openaiService.isAvailable();
    
    if (openaiAvailable) {
      // Use OpenAI for advanced NLP
      const intentResult = await openaiService.analyzeIntent(message, session.context);
      const entities = await openaiService.extractEntities(message);
      const sentiment = await openaiService.analyzeSentiment(message);
      
      nlpResult = {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities,
        sentiment: sentiment.sentiment,
        model: 'openai'
      };
    } else {
      // Fallback to basic NLP
      nlpResult = await processMessage(message, session.context);
    }
    
    // Track NLP processing
    await analyticsService.trackEvent({
      userId,
      sessionId: session.id,
      platform,
      eventType: 'nlp_processed',
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      language: detectedLanguage,
      sentiment: nlpResult.sentiment,
      model: nlpResult.model,
      message,
      responseTime: Date.now() - startTime
    });

    // Generate response using OpenAI if available
    let response;
    if (openaiAvailable) {
      response = await openaiService.generateResponse(
        message, 
        session.context, 
        nlpResult.intent, 
        nlpResult.entities
      );
    } else {
      // Generate response using language service
      response = {
        text: languageService.getContextualResponse(nlpResult.intent, detectedLanguage, session.context),
        type: 'text'
      };
    }

    // Translate response if needed
    if (detectedLanguage !== 'en') {
      response.text = languageService.translate(response.text, detectedLanguage, nlpResult.intent);
    }

    // Add messages to session
    await sessionService.addMessage(session.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    await sessionService.addMessage(session.id, {
      role: 'assistant',
      content: response.text,
      timestamp: new Date().toISOString()
    });

    // Update session context
    await sessionService.updateContext(session.id, {
      lastIntent: nlpResult.intent,
      lastEntities: nlpResult.entities,
      language: detectedLanguage,
      lastActivity: new Date().toISOString()
    });

    const totalResponseTime = Date.now() - startTime;

    // Track successful response
    await analyticsService.trackEvent({
      userId,
      sessionId: session.id,
      platform,
      eventType: 'response_generated',
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      language: detectedLanguage,
      sentiment: nlpResult.sentiment,
      message,
      response: response.text,
      responseTime: totalResponseTime
    });

    logger.info('Chatbot message processed successfully', {
      sessionId: session.id,
      userId,
      platform,
      language: detectedLanguage,
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      responseTime: totalResponseTime,
      messageLength: message.length,
      model: nlpResult.model
    });

    res.json({
      success: true,
      response,
      sessionId: session.id,
      language: detectedLanguage,
      sentiment: nlpResult.sentiment
    });

  } catch (error) {
    const errorResponseTime = Date.now() - startTime;
    
    // Track error event
    if (session) {
      await analyticsService.trackEvent({
        userId: session.userId,
        sessionId: session.id,
        platform: session.platform,
        eventType: 'error',
        message: req.body.message,
        error: error.message,
        responseTime: errorResponseTime
      });
    }

    logger.error('Chatbot message processing failed', {
      sessionId: session?.id,
      userId: req.body.userId,
      platform: req.body.platform,
      message: req.body.message,
      error: error.message,
      stack: error.stack,
      responseTime: errorResponseTime
    });

    res.status(500).json({
      success: false,
      error: 'Sorry, I\'m having trouble right now. Please try again in a moment.',
      sessionId: session?.id
    });
  }
});

// Media upload endpoint
router.post('/media/upload', mediaService.getUploadMiddleware().single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No media file provided'
      });
    }

    const { userId, sessionId } = req.body;
    const mediaInfo = await mediaService.processMediaFile(req.file, userId, sessionId);

    res.json({
      success: true,
      media: mediaInfo
    });
  } catch (error) {
    logger.error('Media upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload media file'
    });
  }
});

// Media file serving endpoint
router.get('/media/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const mediaFile = await mediaService.getMediaFile(filename);
    
    res.sendFile(mediaFile.path);
  } catch (error) {
    logger.error('Media file serving failed:', error);
    res.status(404).json({
      success: false,
      error: 'Media file not found'
    });
  }
});

// Authentication endpoints
router.post('/auth/anonymous', async (req, res) => {
  try {
    const { platform, deviceInfo } = req.body;
    const authResult = authService.createAnonymousUser(platform, deviceInfo);
    
    res.json({
      success: true,
      ...authResult
    });
  } catch (error) {
    logger.error('Anonymous authentication failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create anonymous session'
    });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, platform } = req.body;
    const authResult = await authService.authenticateUser(email, password, platform);
    
    res.json({
      success: true,
      ...authResult
    });
  } catch (error) {
    logger.error('User authentication failed:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// User profile endpoints
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await authService.getUserProfile(userId);
    
    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile'
    });
  }
});

router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const profile = await authService.updateUserProfile(userId, updates);
    
    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error('Failed to update user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

// Language endpoints
router.get('/languages', (req, res) => {
  try {
    const languages = languageService.getSupportedLanguages();
    const stats = languageService.getTranslationStats();
    
    res.json({
      success: true,
      languages,
      stats
    });
  } catch (error) {
    logger.error('Failed to get languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve language information'
    });
  }
});

router.post('/translate', (req, res) => {
  try {
    const { text, targetLang, category, params } = req.body;
    const translatedText = languageService.translate(text, targetLang, category, params);
    
    res.json({
      success: true,
      original: text,
      translated: translatedText,
      language: targetLang
    });
  } catch (error) {
    logger.error('Translation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate text'
    });
  }
});

// OpenAI service endpoints
router.get('/openai/status', async (req, res) => {
  try {
    const isAvailable = await openaiService.isAvailable();
    const stats = openaiService.getStats();
    
    res.json({
      success: true,
      available: isAvailable,
      stats
    });
  } catch (error) {
    logger.error('Failed to check OpenAI status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check service status'
    });
  }
});

// Media service endpoints
router.get('/media/stats', async (req, res) => {
  try {
    const stats = await mediaService.getMediaStats();
    const supportedTypes = mediaService.getSupportedTypes();
    
    res.json({
      success: true,
      stats,
      supportedTypes
    });
  } catch (error) {
    logger.error('Failed to get media stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve media statistics'
    });
  }
});

// Analytics endpoints
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const analytics = await analyticsService.getAnalytics(period);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

router.get('/analytics/intents', async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const performance = await analyticsService.getIntentPerformance(period);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Failed to get intent performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve intent performance'
    });
  }
});

router.get('/analytics/platforms', async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    const usage = await analyticsService.getPlatformUsage(period);
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    logger.error('Failed to get platform usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platform usage'
    });
  }
});

router.get('/analytics/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;
    const journey = await analyticsService.getUserJourney(userId, sessionId);
    
    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    logger.error('Failed to get user journey:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user journey'
    });
  }
});

router.get('/analytics/export', async (req, res) => {
  try {
    const { period = 'day', format = 'json' } = req.query;
    const data = await analyticsService.exportAnalytics(period, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="chatbot-analytics-${period}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    
    res.send(data);
  } catch (error) {
    logger.error('Failed to export analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics'
    });
  }
});

module.exports = router;