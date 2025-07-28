const express = require('express');
const { processMessage } = require('./services/nlpService');
const { getSessionById, createSession, updateSession, getSessionsByUserId } = require('./services/sessionService');
const sessionService = require('./services/sessionService');
const { getExchangeRate } = require('./services/rateService');
const { getTransactionStatus } = require('./services/transactionService');
const { getUserByEmail } = require('./services/userService');
const auth = require('./middleware/auth');
const analyticsService = require('./services/analyticsService');
const openaiService = require('./services/openaiService');
const languageService = require('./services/languageService');
const mediaService = require('./services/mediaService');
const authService = require('./services/authService');
const feeService = require('./services/feeService');
const voiceService = require('./services/voiceService');
const learningService = require('./services/learningService');
const advancedAnalyticsService = require('./services/advancedAnalyticsService');
const integrationService = require('./services/integrationService');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * Select the most relevant session from user sessions
 * @param {Array} userSessions - Array of user sessions
 * @returns {Object} The most relevant session
 */
function selectMostRelevantSession(userSessions) {
  if (!userSessions || userSessions.length === 0) {
    return null;
  }

  // First, try to find an active session
  const activeSession = userSessions.find(session => session.isActive === true);
  if (activeSession) {
    return activeSession;
  }

  // If no active session, find the most recent session based on lastActivity
  const sortedSessions = userSessions.sort((a, b) => {
    const aTime = new Date(a.lastActivity || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastActivity || b.createdAt || 0).getTime();
    return bTime - aTime; // Sort in descending order (most recent first)
  });

  return sortedSessions[0];
}

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
      // Select the most recent or active session
      session = selectMostRelevantSession(userSessions);
      logger.debug('Using existing chatbot session', { 
        sessionId: session.id, 
        userId, 
        platform,
        sessionCount: userSessions.length,
        selectedReason: session.isActive ? 'active' : 'most_recent'
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

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Valid userId is required'
      });
    }

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Valid sessionId is required'
      });
    }

    // Additional validation: Check if session exists and belongs to user
    try {
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sessionId: session not found'
        });
      }

      if (session.userId !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sessionId: session does not belong to user'
        });
      }
    } catch (sessionError) {
      logger.error('Session validation failed:', sessionError);
      return res.status(400).json({
        success: false,
        error: 'Invalid sessionId: unable to validate session'
      });
    }

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
    const { userId, sessionId, token } = req.query;

    // Authorization check: Verify required parameters
    if (!userId || !sessionId) {
      logger.warn('Unauthorized media access attempt - missing credentials', {
        filename,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        error: 'Authentication required to access media files'
      });
    }

    // Validate user authentication
    let userAuth = null;
    try {
      if (token) {
        userAuth = await authService.verifyToken(token);
      } else {
        // For anonymous users, verify session ownership
        userAuth = { userId, isAnonymous: true };
      }
    } catch (authError) {
      logger.warn('Invalid authentication token for media access', {
        filename,
        userId,
        sessionId,
        error: authError.message
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    // Verify session exists and belongs to user
    let session = null;
    try {
      session = await sessionService.getSession(sessionId);
      if (!session) {
        logger.warn('Media access attempt with invalid session', {
          filename,
          userId,
          sessionId
        });
        return res.status(403).json({
          success: false,
          error: 'Invalid session'
        });
      }

      if (session.userId !== userId) {
        logger.warn('Media access attempt - session does not belong to user', {
          filename,
          userId,
          sessionId,
          sessionUserId: session.userId
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied: session does not belong to user'
        });
      }
    } catch (sessionError) {
      logger.error('Session validation failed for media access:', sessionError);
      return res.status(500).json({
        success: false,
        error: 'Unable to verify session'
      });
    }

    // Verify media file exists and user has access
    let mediaFile = null;
    try {
      mediaFile = await mediaService.getMediaFile(filename);
    } catch (fileError) {
      logger.warn('Media file not found or access denied', {
        filename,
        userId,
        sessionId,
        error: fileError.message
      });
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    // Additional security check: Verify file belongs to user's session
    // This assumes mediaService.getMediaFile returns metadata including sessionId
    if (mediaFile.sessionId && mediaFile.sessionId !== sessionId) {
      logger.warn('Media access attempt - file does not belong to session', {
        filename,
        userId,
        sessionId,
        fileSessionId: mediaFile.sessionId
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied: file does not belong to your session'
      });
    }

    // Log successful media access
    logger.info('Media file accessed successfully', {
      filename,
      userId,
      sessionId,
      fileSize: mediaFile.size,
      ip: req.ip
    });

    // Serve the file
    res.sendFile(mediaFile.path);
  } catch (error) {
    logger.error('Media file serving failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve media file'
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

// Fee service endpoints
router.post('/fees/calculate', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency, speed, language } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const feeResult = feeService.calculateTransferFees(
      parseFloat(amount), 
      fromCurrency || 'USD', 
      toCurrency || 'USD', 
      speed || 'standard'
    );

    if (!feeResult.success) {
      return res.status(400).json({
        success: false,
        error: feeResult.error
      });
    }

    // Generate user-friendly explanation
    const explanation = feeService.generateFeeExplanation(
      parseFloat(amount),
      fromCurrency || 'USD',
      toCurrency || 'USD',
      speed || 'standard',
      language || 'en'
    );

    res.json({
      success: true,
      fees: feeResult,
      explanation: explanation.explanation
    });
  } catch (error) {
    logger.error('Fee calculation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fees'
    });
  }
});

router.get('/fees/examples', async (req, res) => {
  try {
    const { currency, language } = req.query;
    const examples = feeService.getFeeExamples(currency || 'USD', language || 'en');
    
    res.json({
      success: true,
      examples
    });
  } catch (error) {
    logger.error('Failed to get fee examples:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve fee examples'
    });
  }
});

router.post('/fees/validate-balance', async (req, res) => {
  try {
    const { userBalance, transferAmount, currency } = req.body;
    
    if (!userBalance || !transferAmount) {
      return res.status(400).json({
        success: false,
        error: 'User balance and transfer amount are required'
      });
    }

    const validation = feeService.validateTransferBalance(
      parseFloat(userBalance),
      parseFloat(transferAmount),
      currency || 'USD'
    );

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Balance validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate balance'
    });
  }
});

router.get('/fees/supported-options', (req, res) => {
  try {
    const options = feeService.getSupportedOptions();
    
    res.json({
      success: true,
      options
    });
  } catch (error) {
    logger.error('Failed to get supported options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve supported options'
    });
  }
});

router.get('/fees/stats', (req, res) => {
  try {
    const stats = feeService.getFeeStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get fee stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve fee statistics'
    });
  }
});

// Voice service endpoints
router.post('/voice/speech-to-text', async (req, res) => {
  try {
    const { audioData, language } = req.body;
    
    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'Audio data is required'
      });
    }

    const audioBuffer = Buffer.from(audioData, 'base64');
    const validation = voiceService.validateAudioFile(audioBuffer);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const result = await voiceService.speechToText(audioBuffer, language || 'en');
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Speech-to-text failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert speech to text'
    });
  }
});

router.post('/voice/text-to-speech', async (req, res) => {
  try {
    const { text, language, options } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await voiceService.textToSpeech(text, language || 'en', options);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Text-to-speech failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert text to speech'
    });
  }
});

router.get('/voice/audio/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const audioFile = await voiceService.getMediaFile(filename);
    
    if (!audioFile) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found'
      });
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.send(audioFile);
  } catch (error) {
    logger.error('Audio file retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audio file'
    });
  }
});

router.get('/voice/voices', (req, res) => {
  try {
    const { language } = req.query;
    const voices = voiceService.getAvailableVoices(language || 'en');
    
    res.json({
      success: true,
      voices
    });
  } catch (error) {
    logger.error('Failed to get available voices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available voices'
    });
  }
});

router.get('/voice/stats', async (req, res) => {
  try {
    const stats = await voiceService.getVoiceStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get voice stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voice statistics'
    });
  }
});

// Learning service endpoints
router.post('/learning/learn', async (req, res) => {
  try {
    const conversationData = req.body;
    const result = await learningService.learnFromConversation(conversationData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Learning from conversation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to learn from conversation'
    });
  }
});

router.get('/learning/personalized-response', async (req, res) => {
  try {
    const { userId, intent, context } = req.query;
    
    // Safely parse context JSON with error handling
    let parsedContext = {};
    if (context) {
      try {
        parsedContext = JSON.parse(context);
        // Validate that parsed result is an object
        if (typeof parsedContext !== 'object' || parsedContext === null) {
          logger.warn('Invalid context format, using empty object', { context, userId });
          parsedContext = {};
        }
      } catch (parseError) {
        logger.warn('Failed to parse context JSON, using empty object', { 
          context, 
          userId, 
          error: parseError.message 
        });
        parsedContext = {};
      }
    }
    
    const result = await learningService.getPersonalizedResponse(userId, intent, parsedContext);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Personalized response generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized response'
    });
  }
});

router.get('/learning/stats', (req, res) => {
  try {
    const stats = learningService.getLearningStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get learning stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve learning statistics'
    });
  }
});

router.get('/learning/export', (req, res) => {
  try {
    const data = learningService.exportLearningData();
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Failed to export learning data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export learning data'
    });
  }
});

// Advanced analytics endpoints
router.post('/analytics/sentiment', async (req, res) => {
  try {
    const { message, context } = req.body;
    const result = await advancedAnalyticsService.analyzeSentiment(message, context);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Sentiment analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment'
    });
  }
});

router.post('/analytics/journey', async (req, res) => {
  try {
    const { userId, sessionId, event } = req.body;
    const result = await advancedAnalyticsService.trackUserJourney(userId, sessionId, event);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('User journey tracking failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track user journey'
    });
  }
});

router.post('/analytics/performance', async (req, res) => {
  try {
    const { sessionId, messages } = req.body;
    const result = await advancedAnalyticsService.analyzeConversationPerformance(sessionId, messages);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Performance analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze conversation performance'
    });
  }
});

router.post('/analytics/abandonment', async (req, res) => {
  try {
    const { sessionId, abandonmentData } = req.body;
    const result = await advancedAnalyticsService.trackAbandonment(sessionId, abandonmentData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Abandonment tracking failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track abandonment'
    });
  }
});

router.get('/analytics/sentiment-report', (req, res) => {
  try {
    const { period } = req.query;
    const analytics = advancedAnalyticsService.getSentimentAnalytics(period || 'day');
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get sentiment analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sentiment analytics'
    });
  }
});

router.get('/analytics/journey-report', (req, res) => {
  try {
    const { period } = req.query;
    const analytics = advancedAnalyticsService.getUserJourneyAnalytics(period || 'day');
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get journey analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve journey analytics'
    });
  }
});

router.get('/analytics/performance-report', (req, res) => {
  try {
    const { period } = req.query;
    const analytics = advancedAnalyticsService.getPerformanceAnalytics(period || 'day');
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance analytics'
    });
  }
});

router.get('/analytics/abandonment-report', (req, res) => {
  try {
    const { period } = req.query;
    const analytics = advancedAnalyticsService.getAbandonmentAnalytics(period || 'day');
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get abandonment analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve abandonment analytics'
    });
  }
});

router.get('/analytics/export', (req, res) => {
  try {
    const { period } = req.query;
    const data = advancedAnalyticsService.exportAnalyticsData(period || 'day');
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Failed to export analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

// Integration service endpoints
router.post('/integration/banking/balance', async (req, res) => {
  try {
    const { provider, accountId, credentials } = req.body;
    const result = await integrationService.checkBankingBalance(provider, accountId, credentials);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Banking balance check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check banking balance'
    });
  }
});

router.post('/integration/banking/transfer', async (req, res) => {
  try {
    const { provider, transferData } = req.body;
    const result = await integrationService.initiateBankingTransfer(provider, transferData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Banking transfer failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate banking transfer'
    });
  }
});

router.get('/integration/banking/status/:provider/:transactionId', async (req, res) => {
  try {
    const { provider, transactionId } = req.params;
    const result = await integrationService.checkTransactionStatus(provider, transactionId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Transaction status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check transaction status'
    });
  }
});

router.post('/integration/compliance/kyc', async (req, res) => {
  try {
    const kycData = req.body;
    const result = await integrationService.verifyKYC(kycData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('KYC verification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify KYC'
    });
  }
});

router.post('/integration/compliance/aml', async (req, res) => {
  try {
    const screeningData = req.body;
    const result = await integrationService.performAMLScreening(screeningData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('AML screening failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform AML screening'
    });
  }
});

router.get('/integration/exchange-rates', async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.query;
    const result = await integrationService.getExchangeRates(fromCurrency, toCurrency);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Exchange rates retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve exchange rates'
    });
  }
});

router.post('/integration/sms/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const result = await integrationService.sendSMS(phoneNumber, message);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('SMS sending failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS'
    });
  }
});

router.post('/integration/webhook/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = req.body;
    const result = await integrationService.sendWebhook(type, data);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Webhook sending failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send webhook'
    });
  }
});

router.get('/integration/status', async (req, res) => {
  try {
    const status = await integrationService.getIntegrationStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Integration status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check integration status'
    });
  }
});

router.get('/integration/stats', (req, res) => {
  try {
    const stats = integrationService.getIntegrationStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get integration stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve integration statistics'
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