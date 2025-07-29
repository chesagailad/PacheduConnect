/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: advancedAnalyticsService - handles backend functionality
 */

const logger = require('../../utils/logger');

class AdvancedAnalyticsService {
  constructor() {
    this.sentimentData = new Map();
    this.userJourneys = new Map();
    this.conversationMetrics = new Map();
    this.performanceMetrics = new Map();
    this.abandonmentData = new Map();
    
    this.sentimentThresholds = {
      positive: 0.6,
      negative: 0.4,
      neutral: 0.4
    };
    
    this.journeyStages = [
      'greeting',
      'intent_discovery',
      'information_gathering',
      'action_planning',
      'execution',
      'confirmation',
      'follow_up',
      'completion'
    ];
  }

  /**
   * Analyze sentiment of user messages
   * @param {string} message - User message
   * @param {object} context - Conversation context
   * @returns {object} Sentiment analysis result
   */
  async analyzeSentiment(message, context = {}) {
    try {
      // In a real implementation, you would use:
      // - Natural language processing libraries
      // - Machine learning models
      // - External sentiment analysis APIs
      
      const sentiment = await this.performSentimentAnalysis(message, context);
      
      // Store sentiment data for analysis
      this.storeSentimentData(message, sentiment, context);
      
      logger.info('Sentiment analysis completed', {
        messageLength: message.length,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence
      });

      return {
        success: true,
        ...sentiment
      };
    } catch (error) {
      logger.error('Sentiment analysis failed:', error);
      return {
        success: false,
        sentiment: 'neutral',
        confidence: 0.5,
        error: error.message
      };
    }
  }

  /**
   * Perform sentiment analysis on message
   * @param {string} message - User message
   * @param {object} context - Conversation context
   * @returns {object} Sentiment result
   */
  async performSentimentAnalysis(message, context) {
    // Simulate sentiment analysis
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect',
      'helpful', 'thanks', 'thank you', 'awesome', 'love', 'like',
      'happy', 'satisfied', 'pleased', 'good job', 'well done'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disappointed', 'angry',
      'frustrated', 'annoyed', 'upset', 'hate', 'dislike', 'problem',
      'issue', 'error', 'wrong', 'broken', 'not working'
    ];

    const messageLower = message.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // Count positive and negative words
    positiveWords.forEach(word => {
      if (messageLower.includes(word)) {
        positiveScore += 1;
      }
    });

    negativeWords.forEach(word => {
      if (messageLower.includes(word)) {
        negativeScore += 1;
      }
    });

    // Calculate sentiment score
    const totalWords = message.split(' ').length;
    const positiveRatio = positiveScore / totalWords;
    const negativeRatio = negativeScore / totalWords;
    
    let sentiment = 'neutral';
    let confidence = 0.5;

    if (positiveRatio > negativeRatio && positiveRatio > 0.1) {
      sentiment = 'positive';
      confidence = Math.min(positiveRatio * 2, 0.9);
    } else if (negativeRatio > positiveRatio && negativeRatio > 0.1) {
      sentiment = 'negative';
      confidence = Math.min(negativeRatio * 2, 0.9);
    }

    return {
      sentiment,
      confidence,
      positiveScore,
      negativeScore,
      totalWords
    };
  }

  /**
   * Store sentiment data for analysis
   * @param {string} message - User message
   * @param {object} sentiment - Sentiment analysis result
   * @param {object} context - Conversation context
   */
  storeSentimentData(message, sentiment, context) {
    const timestamp = new Date().toISOString();
    const sentimentRecord = {
      message,
      sentiment: sentiment.sentiment,
      confidence: sentiment.confidence,
      positiveScore: sentiment.positiveScore,
      negativeScore: sentiment.negativeScore,
      totalWords: sentiment.totalWords,
      timestamp,
      context
    };

    // Store by sentiment type
    const sentimentKey = sentiment.sentiment;
    if (!this.sentimentData.has(sentimentKey)) {
      this.sentimentData.set(sentimentKey, []);
    }
    this.sentimentData.get(sentimentKey).push(sentimentRecord);

    // Store by user if available
    if (context.userId) {
      const userKey = `user_${context.userId}`;
      if (!this.sentimentData.has(userKey)) {
        this.sentimentData.set(userKey, []);
      }
      this.sentimentData.get(userKey).push(sentimentRecord);
    }
  }

  /**
   * Track user journey through conversation
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {object} event - Journey event
   * @returns {object} Journey tracking result
   */
  async trackUserJourney(userId, sessionId, event) {
    try {
      const journeyKey = `${userId}_${sessionId}`;
      let journey = this.userJourneys.get(journeyKey) || {
        userId,
        sessionId,
        startTime: new Date().toISOString(),
        events: [],
        currentStage: 'greeting',
        stageTransitions: [],
        metrics: {
          totalEvents: 0,
          stageDuration: {},
          abandonmentRate: 0,
          completionRate: 0
        }
      };

      // Add event to journey
      journey.events.push({
        ...event,
        timestamp: new Date().toISOString()
      });

      // Update current stage
      const newStage = this.determineJourneyStage(event, journey.currentStage);
      if (newStage !== journey.currentStage) {
        journey.stageTransitions.push({
          from: journey.currentStage,
          to: newStage,
          timestamp: new Date().toISOString(),
          trigger: event.type
        });
        journey.currentStage = newStage;
      }

      // Update metrics
      journey.metrics.totalEvents = journey.events.length;

      this.userJourneys.set(journeyKey, journey);

      logger.info('User journey tracked', {
        userId,
        sessionId,
        eventType: event.type,
        currentStage: journey.currentStage
      });

      return {
        success: true,
        journeyId: journeyKey,
        currentStage: journey.currentStage,
        totalEvents: journey.metrics.totalEvents
      };
    } catch (error) {
      logger.error('User journey tracking failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine journey stage based on event
   * @param {object} event - Journey event
   * @param {string} currentStage - Current stage
   * @returns {string} New stage
   */
  determineJourneyStage(event, currentStage) {
    const stageIndex = this.journeyStages.indexOf(currentStage);
    
    switch (event.type) {
      case 'greeting':
        return 'greeting';
      case 'intent_discovery':
        return 'intent_discovery';
      case 'information_gathering':
        return 'information_gathering';
      case 'action_planning':
        return 'action_planning';
      case 'execution':
        return 'execution';
      case 'confirmation':
        return 'confirmation';
      case 'follow_up':
        return 'follow_up';
      case 'completion':
        return 'completion';
      case 'abandonment':
        return 'abandonment';
      default:
        // Progress to next stage if appropriate
        if (stageIndex < this.journeyStages.length - 1) {
          return this.journeyStages[stageIndex + 1];
        }
        return currentStage;
    }
  }

  /**
   * Analyze conversation performance
   * @param {string} sessionId - Session ID
   * @param {array} messages - Conversation messages
   * @returns {object} Performance analysis
   */
  async analyzeConversationPerformance(sessionId, messages) {
    try {
      const performance = {
        sessionId,
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        botMessages: messages.filter(m => m.role === 'assistant').length,
        averageResponseTime: 0,
        conversationDuration: 0,
        messageLength: {
          user: 0,
          bot: 0
        },
        intentAccuracy: 0,
        satisfactionScore: 0
      };

      // Calculate response times
      let totalResponseTime = 0;
      let responseCount = 0;

      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
          const userTime = new Date(messages[i].timestamp).getTime();
          const botTime = new Date(messages[i + 1].timestamp).getTime();
          totalResponseTime += (botTime - userTime);
          responseCount++;
        }
      }

      if (responseCount > 0) {
        performance.averageResponseTime = totalResponseTime / responseCount;
      }

      // Calculate conversation duration
      if (messages.length > 0) {
        const startTime = new Date(messages[0].timestamp).getTime();
        const endTime = new Date(messages[messages.length - 1].timestamp).getTime();
        performance.conversationDuration = endTime - startTime;
      }

      // Calculate message lengths
      const userMessages = messages.filter(m => m.role === 'user');
      const botMessages = messages.filter(m => m.role === 'assistant');

      performance.messageLength.user = userMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / userMessages.length || 0;
      performance.messageLength.bot = botMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / botMessages.length || 0;

      // Store performance data
      this.performanceMetrics.set(sessionId, performance);

      logger.info('Conversation performance analyzed', {
        sessionId,
        totalMessages: performance.totalMessages,
        averageResponseTime: performance.averageResponseTime,
        conversationDuration: performance.conversationDuration
      });

      return {
        success: true,
        performance
      };
    } catch (error) {
      logger.error('Conversation performance analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track conversation abandonment
   * @param {string} sessionId - Session ID
   * @param {object} abandonmentData - Abandonment data
   * @returns {object} Abandonment tracking result
   */
  async trackAbandonment(sessionId, abandonmentData) {
    try {
      const abandonment = {
        sessionId,
        timestamp: new Date().toISOString(),
        stage: abandonmentData.stage,
        reason: abandonmentData.reason,
        duration: abandonmentData.duration,
        messages: abandonmentData.messages || [],
        lastIntent: abandonmentData.lastIntent,
        userSentiment: abandonmentData.sentiment
      };

      this.abandonmentData.set(sessionId, abandonment);

      logger.info('Conversation abandonment tracked', {
        sessionId,
        stage: abandonment.stage,
        reason: abandonment.reason,
        duration: abandonment.duration
      });

      return {
        success: true,
        abandonmentId: sessionId
      };
    } catch (error) {
      logger.error('Abandonment tracking failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get sentiment analytics
   * @param {string} period - Time period (day, week, month)
   * @returns {object} Sentiment analytics
   */
  getSentimentAnalytics(period = 'day') {
    const analytics = {
      period,
      totalMessages: 0,
      sentimentDistribution: {
        positive: 0,
        negative: 0,
        neutral: 0
      },
      averageConfidence: 0,
      topPositiveWords: [],
      topNegativeWords: [],
      userSentimentTrends: {}
    };

    // Aggregate sentiment data
    this.sentimentData.forEach((records, key) => {
      if (key.startsWith('user_')) {
        const userId = key.replace('user_', '');
        analytics.userSentimentTrends[userId] = {
          totalMessages: records.length,
          averageSentiment: this.calculateAverageSentiment(records),
          sentimentHistory: records.map(r => ({
            sentiment: r.sentiment,
            confidence: r.confidence,
            timestamp: r.timestamp
          }))
        };
      } else if (['positive', 'negative', 'neutral'].includes(key)) {
        analytics.sentimentDistribution[key] = records.length;
        analytics.totalMessages += records.length;
      }
    });

    // Calculate average confidence
    const allRecords = Array.from(this.sentimentData.values()).flat();
    analytics.averageConfidence = allRecords.reduce((sum, r) => sum + r.confidence, 0) / allRecords.length || 0;

    return analytics;
  }

  /**
   * Calculate average sentiment from records
   * @param {array} records - Sentiment records
   * @returns {number} Average sentiment score
   */
  calculateAverageSentiment(records) {
    const sentimentScores = {
      positive: 1,
      neutral: 0.5,
      negative: 0
    };

    const totalScore = records.reduce((sum, r) => sum + sentimentScores[r.sentiment], 0);
    return totalScore / records.length || 0;
  }

  /**
   * Get user journey analytics
   * @param {string} period - Time period
   * @returns {object} Journey analytics
   */
  getUserJourneyAnalytics(period = 'day') {
    const analytics = {
      period,
      totalJourneys: this.userJourneys.size,
      stageDistribution: {},
      averageJourneyDuration: 0,
      completionRate: 0,
      abandonmentRate: 0,
      popularPaths: [],
      bottlenecks: []
    };

    // Analyze journey stages
    this.userJourneys.forEach((journey, key) => {
      // Stage distribution
      journey.stageTransitions.forEach(transition => {
        analytics.stageDistribution[transition.to] = 
          (analytics.stageDistribution[transition.to] || 0) + 1;
      });

      // Journey duration
      const startTime = new Date(journey.startTime).getTime();
      const endTime = new Date(journey.events[journey.events.length - 1]?.timestamp || journey.startTime).getTime();
      const duration = endTime - startTime;
      analytics.averageJourneyDuration += duration;
    });

    if (analytics.totalJourneys > 0) {
      analytics.averageJourneyDuration /= analytics.totalJourneys;
    }

    // Calculate completion and abandonment rates
    let completed = 0;
    let abandoned = 0;

    this.userJourneys.forEach(journey => {
      if (journey.currentStage === 'completion') {
        completed++;
      } else if (journey.currentStage === 'abandonment') {
        abandoned++;
      }
    });

    analytics.completionRate = completed / analytics.totalJourneys || 0;
    analytics.abandonmentRate = abandoned / analytics.totalJourneys || 0;

    return analytics;
  }

  /**
   * Get performance analytics
   * @param {string} period - Time period
   * @returns {object} Performance analytics
   */
  getPerformanceAnalytics(period = 'day') {
    const analytics = {
      period,
      totalSessions: this.performanceMetrics.size,
      averageResponseTime: 0,
      averageConversationDuration: 0,
      averageMessageLength: {
        user: 0,
        bot: 0
      },
      satisfactionTrends: {}
    };

    let totalResponseTime = 0;
    let totalDuration = 0;
    let totalUserLength = 0;
    let totalBotLength = 0;
    let sessionCount = 0;

    this.performanceMetrics.forEach(performance => {
      totalResponseTime += performance.averageResponseTime;
      totalDuration += performance.conversationDuration;
      totalUserLength += performance.messageLength.user;
      totalBotLength += performance.messageLength.bot;
      sessionCount++;
    });

    if (sessionCount > 0) {
      analytics.averageResponseTime = totalResponseTime / sessionCount;
      analytics.averageConversationDuration = totalDuration / sessionCount;
      analytics.averageMessageLength.user = totalUserLength / sessionCount;
      analytics.averageMessageLength.bot = totalBotLength / sessionCount;
    }

    return analytics;
  }

  /**
   * Get abandonment analytics
   * @param {string} period - Time period
   * @returns {object} Abandonment analytics
   */
  getAbandonmentAnalytics(period = 'day') {
    const analytics = {
      period,
      totalAbandonments: this.abandonmentData.size,
      abandonmentByStage: {},
      abandonmentByReason: {},
      averageAbandonmentDuration: 0,
      topAbandonmentReasons: []
    };

    let totalDuration = 0;

    this.abandonmentData.forEach(abandonment => {
      // Stage distribution
      analytics.abandonmentByStage[abandonment.stage] = 
        (analytics.abandonmentByStage[abandonment.stage] || 0) + 1;

      // Reason distribution
      analytics.abandonmentByReason[abandonment.reason] = 
        (analytics.abandonmentByReason[abandonment.reason] || 0) + 1;

      totalDuration += abandonment.duration;
    });

    if (analytics.totalAbandonments > 0) {
      analytics.averageAbandonmentDuration = totalDuration / analytics.totalAbandonments;
    }

    // Get top abandonment reasons
    analytics.topAbandonmentReasons = Object.entries(analytics.abandonmentByReason)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return analytics;
  }

  /**
   * Export analytics data
   * @param {string} period - Time period
   * @returns {object} Complete analytics export
   */
  exportAnalyticsData(period = 'day') {
    return {
      sentiment: this.getSentimentAnalytics(period),
      journeys: this.getUserJourneyAnalytics(period),
      performance: this.getPerformanceAnalytics(period),
      abandonment: this.getAbandonmentAnalytics(period),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AdvancedAnalyticsService(); 