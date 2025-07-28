const OpenAI = require('openai');
const logger = require('../../utils/logger');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;

    // System prompts for different tasks
    this.systemPrompts = {
      intent: `You are an AI assistant for a money transfer and remittance platform called Pachedu. 
Your role is to understand user messages and classify their intent. 

Available intents:
- greeting: User says hello, hi, good morning, etc.
- exchange_rate: User asks about currency exchange rates
- send_money: User wants to send money or transfer funds
- track_transaction: User wants to track a transaction or check status
- kyc_help: User needs help with KYC verification
- fees_info: User asks about fees, charges, or costs
- support: User needs general help or support
- goodbye: User says goodbye, thank you, bye, etc.
- unknown: When intent is unclear

Respond with ONLY the intent name, nothing else.`,

      entities: `You are an AI assistant for a money transfer platform. Extract relevant entities from user messages.

Entity types to extract:
- currency: USD, ZAR, EUR, GBP, etc.
- amount: Money amounts (e.g., 1000, $500, R2000)
- transaction_id: Transaction IDs (e.g., PC123456, TX789)
- country: Country names (e.g., Zimbabwe, South Africa, USA)
- recipient: Recipient names or phone numbers

Respond with a JSON object containing the entities found:
{
  "entities": [
    {"type": "currency", "value": "USD"},
    {"type": "amount", "value": "1000"}
  ]
}`,

      response: `You are a helpful AI assistant for Pachedu, a money transfer and remittance platform. 
Provide friendly, helpful responses to user queries about money transfers, exchange rates, fees, and general support.

Key guidelines:
- Be warm and professional
- Provide accurate information about our services
- Keep responses concise but informative
- Offer relevant next steps when appropriate
- If you don't know something, suggest contacting support
- Use simple, clear language
- Be culturally sensitive to African users

Current context: {context}`,

      conversation: `You are an AI assistant for Pachedu money transfer platform. 
Analyze the conversation context and provide a natural, contextual response.

Consider:
- Previous messages in the conversation
- User's intent and entities mentioned
- Platform context (web, WhatsApp, Telegram)
- Cultural context for African users

Provide a helpful, contextual response that builds on the conversation.`
    };
  }

  /**
   * Analyze message intent using OpenAI
   * @param {string} message - User message
   * @param {object} context - Conversation context
   * @returns {object} Intent analysis result
   */
  async analyzeIntent(message, context = {}) {
    try {
      const prompt = `${this.systemPrompts.intent}

User message: "${message}"
Previous intent: ${context.lastIntent || 'none'}

Intent:`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompts.intent },
          { role: 'user', content: `User message: "${message}"\nPrevious intent: ${context.lastIntent || 'none'}\n\nIntent:` }
        ],
        max_tokens: 50,
        temperature: 0.3
      });

      const intent = response.choices[0].message.content.trim().toLowerCase();
      
      // Validate intent
      const validIntents = [
        'greeting', 'exchange_rate', 'send_money', 'track_transaction',
        'kyc_help', 'fees_info', 'support', 'goodbye', 'unknown'
      ];

      const finalIntent = validIntents.includes(intent) ? intent : 'unknown';
      const confidence = validIntents.includes(intent) ? 0.9 : 0.3;

      logger.debug('OpenAI intent analysis completed', {
        message: message.substring(0, 100),
        intent: finalIntent,
        confidence,
        model: this.model
      });

      return {
        intent: finalIntent,
        confidence,
        model: 'openai',
        rawResponse: response.choices[0].message.content
      };
    } catch (error) {
      logger.error('OpenAI intent analysis failed:', error);
      return {
        intent: 'unknown',
        confidence: 0.1,
        model: 'openai',
        error: error.message
      };
    }
  }

  /**
   * Extract entities from message using OpenAI
   * @param {string} message - User message
   * @returns {array} Array of extracted entities
   */
  async extractEntities(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompts.entities },
          { role: 'user', content: `Extract entities from: "${message}"` }
        ],
        max_tokens: 200,
        temperature: 0.1
      });

      const content = response.choices[0].message.content.trim();
      
      // Parse JSON response
      let entities = [];
      try {
        const parsed = JSON.parse(content);
        entities = parsed.entities || [];
      } catch (parseError) {
        logger.warn('Failed to parse OpenAI entity response:', parseError);
      }

      logger.debug('OpenAI entity extraction completed', {
        message: message.substring(0, 100),
        entitiesCount: entities.length,
        model: this.model
      });

      return entities;
    } catch (error) {
      logger.error('OpenAI entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Generate contextual response using OpenAI
   * @param {string} message - User message
   * @param {object} context - Conversation context
   * @param {string} intent - Detected intent
   * @param {array} entities - Extracted entities
   * @returns {object} Generated response
   */
  async generateResponse(message, context = {}, intent = 'unknown', entities = []) {
    try {
      const contextStr = JSON.stringify({
        lastIntent: context.lastIntent,
        lastEntities: context.lastEntities,
        platform: context.platform,
        sessionDuration: context.sessionDuration
      });

      const entitiesStr = entities.map(e => `${e.type}: ${e.value}`).join(', ');
      
      const prompt = `${this.systemPrompts.response.replace('{context}', contextStr)}

Intent: ${intent}
Entities: ${entitiesStr || 'none'}
User message: "${message}"

Response:`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompts.response.replace('{context}', contextStr) },
          { role: 'user', content: `Intent: ${intent}\nEntities: ${entitiesStr || 'none'}\nUser message: "${message}"\n\nResponse:` }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      const generatedText = response.choices[0].message.content.trim();

      logger.debug('OpenAI response generation completed', {
        message: message.substring(0, 100),
        intent,
        entitiesCount: entities.length,
        responseLength: generatedText.length,
        model: this.model
      });

      return {
        text: generatedText,
        type: 'text',
        model: 'openai',
        tokens: response.usage?.total_tokens || 0
      };
    } catch (error) {
      logger.error('OpenAI response generation failed:', error);
      return {
        text: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        type: 'text',
        model: 'openai',
        error: error.message
      };
    }
  }

  /**
   * Analyze conversation context and generate contextual response
   * @param {array} conversationHistory - Array of previous messages
   * @param {string} currentMessage - Current user message
   * @param {object} context - Additional context
   * @returns {object} Contextual response
   */
  async generateContextualResponse(conversationHistory, currentMessage, context = {}) {
    try {
      // Build conversation context
      const historyStr = conversationHistory
        .slice(-5) // Last 5 messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompts.conversation },
          { role: 'user', content: `Conversation history:\n${historyStr}\n\nCurrent message: "${currentMessage}"\n\nContext: ${JSON.stringify(context)}\n\nResponse:` }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });

      const generatedText = response.choices[0].message.content.trim();

      logger.debug('OpenAI contextual response generated', {
        historyLength: conversationHistory.length,
        currentMessage: currentMessage.substring(0, 100),
        responseLength: generatedText.length,
        model: this.model
      });

      return {
        text: generatedText,
        type: 'text',
        model: 'openai',
        tokens: response.usage?.total_tokens || 0
      };
    } catch (error) {
      logger.error('OpenAI contextual response generation failed:', error);
      return {
        text: 'I apologize, but I\'m having trouble understanding the context right now. Could you please rephrase your question?',
        type: 'text',
        model: 'openai',
        error: error.message
      };
    }
  }

  /**
   * Analyze sentiment of user message
   * @param {string} message - User message
   * @returns {object} Sentiment analysis result
   */
  async analyzeSentiment(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Analyze the sentiment of the user message. Respond with only: positive, negative, or neutral.' },
          { role: 'user', content: `Analyze sentiment: "${message}"` }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const sentiment = response.choices[0].message.content.trim().toLowerCase();
      
      logger.debug('OpenAI sentiment analysis completed', {
        message: message.substring(0, 100),
        sentiment,
        model: this.model
      });

      return {
        sentiment,
        confidence: 0.8,
        model: 'openai'
      };
    } catch (error) {
      logger.error('OpenAI sentiment analysis failed:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        model: 'openai',
        error: error.message
      };
    }
  }

  /**
   * Detect language of user message
   * @param {string} message - User message
   * @returns {object} Language detection result
   */
  async detectLanguage(message) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Detect the language of the user message. Respond with only the language code (en, sn, nd, etc.).' },
          { role: 'user', content: `Detect language: "${message}"` }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const language = response.choices[0].message.content.trim().toLowerCase();
      
      logger.debug('OpenAI language detection completed', {
        message: message.substring(0, 100),
        language,
        model: this.model
      });

      return {
        language,
        confidence: 0.9,
        model: 'openai'
      };
    } catch (error) {
      logger.error('OpenAI language detection failed:', error);
      return {
        language: 'en',
        confidence: 0.5,
        model: 'openai',
        error: error.message
      };
    }
  }

  /**
   * Check if OpenAI service is available
   * @returns {boolean} Service availability
   */
  async isAvailable() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }

      // Test with a simple request
      await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });

      return true;
    } catch (error) {
      logger.warn('OpenAI service not available:', error.message);
      return false;
    }
  }

  /**
   * Get service statistics
   * @returns {object} Service statistics
   */
  getStats() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      available: !!process.env.OPENAI_API_KEY
    };
  }
}

module.exports = new OpenAIService(); 