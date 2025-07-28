const logger = require('../../utils/logger');

class LearningService {
  constructor() {
    this.conversationPatterns = new Map();
    this.userPreferences = new Map();
    this.responseEffectiveness = new Map();
    this.intentAccuracy = new Map();
    this.feedbackData = new Map();
    
    this.learningRate = 0.1;
    this.minDataPoints = 10;
    this.maxPatterns = 1000;
    
    this.setupLearningMetrics();
  }

  /**
   * Setup learning metrics and patterns
   */
  setupLearningMetrics() {
    // Initialize conversation patterns
    this.conversationPatterns.set('greeting_followup', {
      pattern: ['greeting', 'exchange_rate', 'send_money'],
      frequency: 0,
      success_rate: 0.8
    });

    this.conversationPatterns.set('fees_inquiry', {
      pattern: ['fees_info', 'send_money', 'kyc_help'],
      frequency: 0,
      success_rate: 0.85
    });

    this.conversationPatterns.set('transaction_tracking', {
      pattern: ['track_transaction', 'support', 'goodbye'],
      frequency: 0,
      success_rate: 0.9
    });

    // Initialize user preference patterns
    this.userPreferences.set('language_preference', {
      en: 0.6,
      sn: 0.25,
      nd: 0.15
    });

    this.userPreferences.set('response_type', {
      text: 0.7,
      voice: 0.2,
      interactive: 0.1
    });

    this.userPreferences.set('session_duration', {
      short: 0.4, // < 5 minutes
      medium: 0.4, // 5-15 minutes
      long: 0.2 // > 15 minutes
    });
  }

  /**
   * Learn from conversation data
   * @param {object} conversationData - Conversation data
   * @returns {object} Learning result
   */
  async learnFromConversation(conversationData) {
    try {
      const {
        userId,
        sessionId,
        messages,
        intents,
        entities,
        responses,
        feedback,
        duration,
        language,
        platform
      } = conversationData;

      // Extract conversation pattern
      const pattern = this.extractConversationPattern(intents);
      await this.updateConversationPattern(pattern, feedback);

      // Learn user preferences
      await this.updateUserPreferences(userId, {
        language,
        platform,
        sessionDuration: duration,
        responseTypes: responses.map(r => r.type)
      });

      // Learn response effectiveness
      await this.updateResponseEffectiveness(responses, feedback);

      // Learn intent accuracy
      await this.updateIntentAccuracy(intents, entities, feedback);

      logger.info('Learning from conversation completed', {
        userId,
        sessionId,
        patternLength: pattern.length,
        feedback: feedback?.rating || 'none'
      });

      return {
        success: true,
        patternsLearned: 1,
        preferencesUpdated: true
      };
    } catch (error) {
      logger.error('Learning from conversation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract conversation pattern from intents
   * @param {array} intents - Array of intents
   * @returns {array} Conversation pattern
   */
  extractConversationPattern(intents) {
    return intents.map(intent => intent.intent || intent);
  }

  /**
   * Update conversation pattern learning
   * @param {array} pattern - Conversation pattern
   * @param {object} feedback - User feedback
   */
  async updateConversationPattern(pattern, feedback) {
    const patternKey = pattern.join('_');
    const existingPattern = this.conversationPatterns.get(patternKey);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency += 1;
      if (feedback?.rating) {
        const currentRate = existingPattern.success_rate;
        const newRate = (currentRate + feedback.rating) / 2;
        existingPattern.success_rate = Math.min(newRate, 1.0);
      }
    } else if (this.conversationPatterns.size < this.maxPatterns) {
      // Add new pattern
      this.conversationPatterns.set(patternKey, {
        pattern,
        frequency: 1,
        success_rate: feedback?.rating || 0.5
      });
    }

    // Clean up old patterns if needed
    if (this.conversationPatterns.size > this.maxPatterns) {
      this.cleanupOldPatterns();
    }
  }

  /**
   * Update user preferences based on conversation data
   * @param {string} userId - User ID
   * @param {object} preferences - User preferences
   */
  async updateUserPreferences(userId, preferences) {
    const userPrefs = this.userPreferences.get(userId) || {};

    // Update language preference
    if (preferences.language) {
      userPrefs.language = userPrefs.language || {};
      userPrefs.language[preferences.language] = 
        (userPrefs.language[preferences.language] || 0) + 1;
    }

    // Update platform preference
    if (preferences.platform) {
      userPrefs.platform = userPrefs.platform || {};
      userPrefs.platform[preferences.platform] = 
        (userPrefs.platform[preferences.platform] || 0) + 1;
    }

    // Update session duration preference
    if (preferences.sessionDuration) {
      const duration = this.categorizeSessionDuration(preferences.sessionDuration);
      userPrefs.sessionDuration = userPrefs.sessionDuration || {};
      userPrefs.sessionDuration[duration] = 
        (userPrefs.sessionDuration[duration] || 0) + 1;
    }

    // Update response type preference
    if (preferences.responseTypes) {
      userPrefs.responseTypes = userPrefs.responseTypes || {};
      preferences.responseTypes.forEach(type => {
        userPrefs.responseTypes[type] = (userPrefs.responseTypes[type] || 0) + 1;
      });
    }

    this.userPreferences.set(userId, userPrefs);
  }

  /**
   * Update response effectiveness based on feedback
   * @param {array} responses - Bot responses
   * @param {object} feedback - User feedback
   */
  async updateResponseEffectiveness(responses, feedback) {
    if (!feedback?.rating) return;

    responses.forEach(response => {
      const responseKey = `${response.type}_${response.intent || 'general'}`;
      const existing = this.responseEffectiveness.get(responseKey) || {
        count: 0,
        totalRating: 0,
        averageRating: 0
      };

      existing.count += 1;
      existing.totalRating += feedback.rating;
      existing.averageRating = existing.totalRating / existing.count;

      this.responseEffectiveness.set(responseKey, existing);
    });
  }

  /**
   * Update intent accuracy based on feedback
   * @param {array} intents - Detected intents
   * @param {array} entities - Extracted entities
   * @param {object} feedback - User feedback
   */
  async updateIntentAccuracy(intents, entities, feedback) {
    if (!feedback?.rating) return;

    intents.forEach(intent => {
      const intentKey = intent.intent || intent;
      const existing = this.intentAccuracy.get(intentKey) || {
        count: 0,
        totalRating: 0,
        averageRating: 0,
        entityAccuracy: {}
      };

      existing.count += 1;
      existing.totalRating += feedback.rating;
      existing.averageRating = existing.totalRating / existing.count;

      // Track entity accuracy
      if (entities && entities.length > 0) {
        entities.forEach(entity => {
          const entityKey = entity.type;
          existing.entityAccuracy[entityKey] = 
            (existing.entityAccuracy[entityKey] || 0) + 1;
        });
      }

      this.intentAccuracy.set(intentKey, existing);
    });
  }

  /**
   * Get personalized response based on learning
   * @param {string} userId - User ID
   * @param {string} intent - Current intent
   * @param {object} context - Conversation context
   * @returns {object} Personalized response
   */
  async getPersonalizedResponse(userId, intent, context = {}) {
    try {
      const userPrefs = this.userPreferences.get(userId);
      const responseEffectiveness = this.getResponseEffectiveness(intent);
      const conversationPattern = this.predictNextIntent(context);

      const personalization = {
        language: this.getPreferredLanguage(userPrefs),
        responseType: this.getPreferredResponseType(userPrefs),
        responseStyle: this.getResponseStyle(userPrefs),
        nextIntent: conversationPattern,
        effectiveness: responseEffectiveness
      };

      logger.info('Personalized response generated', {
        userId,
        intent,
        language: personalization.language,
        responseType: personalization.responseType
      });

      return {
        success: true,
        personalization
      };
    } catch (error) {
      logger.error('Personalized response generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's preferred language
   * @param {object} userPrefs - User preferences
   * @returns {string} Preferred language
   */
  getPreferredLanguage(userPrefs) {
    if (!userPrefs?.language) return 'en';

    const languages = userPrefs.language;
    const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 'en';

    // Find most used language
    let preferredLanguage = 'en';
    let maxCount = 0;

    Object.entries(languages).forEach(([lang, count]) => {
      if (count > maxCount) {
        maxCount = count;
        preferredLanguage = lang;
      }
    });

    return preferredLanguage;
  }

  /**
   * Get user's preferred response type
   * @param {object} userPrefs - User preferences
   * @returns {string} Preferred response type
   */
  getPreferredResponseType(userPrefs) {
    if (!userPrefs?.responseTypes) return 'text';

    const types = userPrefs.responseTypes;
    const total = Object.values(types).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 'text';

    // Find most used response type
    let preferredType = 'text';
    let maxCount = 0;

    Object.entries(types).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        preferredType = type;
      }
    });

    return preferredType;
  }

  /**
   * Get response style based on user preferences
   * @param {object} userPrefs - User preferences
   * @returns {string} Response style
   */
  getResponseStyle(userPrefs) {
    if (!userPrefs?.sessionDuration) return 'concise';

    const durations = userPrefs.sessionDuration;
    const short = durations.short || 0;
    const medium = durations.medium || 0;
    const long = durations.long || 0;

    if (short > medium && short > long) return 'concise';
    if (long > medium && long > short) return 'detailed';
    return 'balanced';
  }

  /**
   * Get response effectiveness for intent
   * @param {string} intent - Intent
   * @returns {object} Effectiveness data
   */
  getResponseEffectiveness(intent) {
    const effectiveness = this.responseEffectiveness.get(`${intent}_${intent}`) ||
                        this.responseEffectiveness.get(`${intent}_general`);

    return effectiveness || {
      count: 0,
      averageRating: 0.5
    };
  }

  /**
   * Predict next intent based on conversation pattern
   * @param {object} context - Conversation context
   * @returns {string} Predicted next intent
   */
  predictNextIntent(context) {
    const currentPattern = context.recentIntents || [];
    
    // Find matching patterns
    const matchingPatterns = [];
    
    this.conversationPatterns.forEach((pattern, key) => {
      const patternArray = pattern.pattern;
      const matchIndex = this.findPatternMatch(currentPattern, patternArray);
      
      if (matchIndex !== -1) {
        matchingPatterns.push({
          key,
          pattern: patternArray,
          matchIndex,
          frequency: pattern.frequency,
          successRate: pattern.success_rate
        });
      }
    });

    if (matchingPatterns.length === 0) return null;

    // Sort by success rate and frequency
    matchingPatterns.sort((a, b) => {
      const scoreA = a.successRate * a.frequency;
      const scoreB = b.successRate * b.frequency;
      return scoreB - scoreA;
    });

    const bestMatch = matchingPatterns[0];
    const nextIndex = bestMatch.matchIndex + currentPattern.length;
    
    return bestMatch.pattern[nextIndex] || null;
  }

  /**
   * Find pattern match in current conversation
   * @param {array} current - Current intents
   * @param {array} pattern - Pattern to match
   * @returns {number} Match index or -1
   */
  findPatternMatch(current, pattern) {
    for (let i = 0; i <= current.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (current[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
    return -1;
  }

  /**
   * Categorize session duration
   * @param {number} duration - Duration in minutes
   * @returns {string} Duration category
   */
  categorizeSessionDuration(duration) {
    if (duration < 5) return 'short';
    if (duration < 15) return 'medium';
    return 'long';
  }

  /**
   * Clean up old patterns
   */
  cleanupOldPatterns() {
    const patterns = Array.from(this.conversationPatterns.entries());
    
    // Sort by frequency and success rate
    patterns.sort((a, b) => {
      const scoreA = a[1].frequency * a[1].success_rate;
      const scoreB = b[1].frequency * b[1].success_rate;
      return scoreA - scoreB;
    });

    // Remove bottom 20%
    const removeCount = Math.floor(patterns.length * 0.2);
    for (let i = 0; i < removeCount; i++) {
      this.conversationPatterns.delete(patterns[i][0]);
    }
  }

  /**
   * Get learning statistics
   * @returns {object} Learning statistics
   */
  getLearningStats() {
    const totalPatterns = this.conversationPatterns.size;
    const totalUsers = this.userPreferences.size;
    const totalResponses = this.responseEffectiveness.size;
    const totalIntents = this.intentAccuracy.size;

    const averageSuccessRate = Array.from(this.conversationPatterns.values())
      .reduce((sum, pattern) => sum + pattern.success_rate, 0) / totalPatterns;

    const averageResponseRating = Array.from(this.responseEffectiveness.values())
      .reduce((sum, response) => sum + response.averageRating, 0) / totalResponses;

    return {
      totalPatterns,
      totalUsers,
      totalResponses,
      totalIntents,
      averageSuccessRate: averageSuccessRate || 0,
      averageResponseRating: averageResponseRating || 0,
      learningRate: this.learningRate,
      minDataPoints: this.minDataPoints
    };
  }

  /**
   * Export learning data for analysis
   * @returns {object} Learning data export
   */
  exportLearningData() {
    return {
      conversationPatterns: Object.fromEntries(this.conversationPatterns),
      userPreferences: Object.fromEntries(this.userPreferences),
      responseEffectiveness: Object.fromEntries(this.responseEffectiveness),
      intentAccuracy: Object.fromEntries(this.intentAccuracy),
      stats: this.getLearningStats()
    };
  }

  /**
   * Import learning data
   * @param {object} data - Learning data to import
   */
  importLearningData(data) {
    if (data.conversationPatterns) {
      this.conversationPatterns = new Map(Object.entries(data.conversationPatterns));
    }
    if (data.userPreferences) {
      this.userPreferences = new Map(Object.entries(data.userPreferences));
    }
    if (data.responseEffectiveness) {
      this.responseEffectiveness = new Map(Object.entries(data.responseEffectiveness));
    }
    if (data.intentAccuracy) {
      this.intentAccuracy = new Map(Object.entries(data.intentAccuracy));
    }

    logger.info('Learning data imported successfully');
  }
}

module.exports = new LearningService(); 