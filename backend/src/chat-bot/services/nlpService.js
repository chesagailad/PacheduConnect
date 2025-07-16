// Simple NLP service for intent recognition and entity extraction
// In production, this could integrate with services like OpenAI, Dialogflow, or Rasa

const intents = {
  greeting: {
    patterns: [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'start', 'begin', 'help me', 'assist me'
    ],
    responses: ['greeting']
  },
  exchange_rate: {
    patterns: [
      'exchange rate', 'rate', 'rates', 'currency', 'usd', 'zar', 'rand',
      'convert', 'conversion', 'how much', 'current rate', 'today rate'
    ],
    responses: ['exchange_rate']
  },
  send_money: {
    patterns: [
      'send money', 'transfer', 'remit', 'send', 'transfer money',
      'send cash', 'money transfer', 'remittance', 'payment'
    ],
    responses: ['send_money']
  },
  track_transaction: {
    patterns: [
      'track', 'status', 'check transaction', 'transaction status',
      'where is my money', 'track transfer', 'transaction id', 'receipt'
    ],
    responses: ['track_transaction']
  },
  kyc_help: {
    patterns: [
      'kyc', 'verification', 'verify', 'documents', 'identity',
      'upload', 'id document', 'passport', 'proof of address'
    ],
    responses: ['kyc_help']
  },
  fees_info: {
    patterns: [
      'fees', 'cost', 'charges', 'how much does it cost', 'price',
      'commission', 'rate', 'expensive', 'cheap'
    ],
    responses: ['fees_info']
  },
  support: {
    patterns: [
      'support', 'help', 'contact', 'customer service', 'phone number',
      'email', 'whatsapp', 'problem', 'issue', 'complaint'
    ],
    responses: ['support']
  },
  goodbye: {
    patterns: [
      'bye', 'goodbye', 'see you', 'thanks', 'thank you',
      'that\'s all', 'done', 'finish', 'exit'
    ],
    responses: ['goodbye']
  }
};

const entities = {
  currency: {
    patterns: ['usd', 'zar', 'rand', 'dollar', 'dollars', 'eur', 'euro', 'gbp', 'pound'],
    values: {
      'usd': 'USD', 'dollar': 'USD', 'dollars': 'USD',
      'zar': 'ZAR', 'rand': 'ZAR',
      'eur': 'EUR', 'euro': 'EUR',
      'gbp': 'GBP', 'pound': 'GBP'
    }
  },
  amount: {
    patterns: [/\d+(\.\d{2})?/, /r\d+/, /\$\d+/, /usd\s*\d+/, /zar\s*\d+/i]
  },
  transaction_id: {
    patterns: [/pc\d{6,}/i, /transaction\s+pc\d{6,}/i]
  }
};

/**
 * Process a message and extract intent and entities
 * @param {string} message - User message
 * @param {object} context - Conversation context
 * @returns {object} - Intent, entities, and confidence
 */
async function processMessage(message, context = {}) {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Extract intent
  const intentResult = extractIntent(normalizedMessage);
  
  // Extract entities
  const extractedEntities = extractEntities(normalizedMessage);
  
  // Improve confidence based on context
  const confidence = calculateConfidence(intentResult, extractedEntities, context);
  
  return {
    intent: intentResult.intent,
    confidence: confidence,
    entities: extractedEntities,
    originalMessage: message,
    normalizedMessage: normalizedMessage
  };
}

/**
 * Extract intent from message
 * @param {string} normalizedMessage 
 * @returns {object}
 */
function extractIntent(normalizedMessage) {
  let bestMatch = { intent: 'unknown', score: 0 };
  
  for (const [intentName, intentData] of Object.entries(intents)) {
    for (const pattern of intentData.patterns) {
      if (normalizedMessage.includes(pattern)) {
        const score = calculatePatternScore(pattern, normalizedMessage);
        if (score > bestMatch.score) {
          bestMatch = { intent: intentName, score };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Extract entities from message
 * @param {string} normalizedMessage 
 * @returns {array}
 */
function extractEntities(normalizedMessage) {
  const extractedEntities = [];
  
  for (const [entityType, entityData] of Object.entries(entities)) {
    for (const pattern of entityData.patterns) {
      let matches = [];
      
      if (pattern instanceof RegExp) {
        const regexMatches = normalizedMessage.match(pattern);
        if (regexMatches) {
          matches = regexMatches;
        }
      } else if (typeof pattern === 'string') {
        if (normalizedMessage.includes(pattern)) {
          matches = [pattern];
        }
      }
      
      for (const match of matches) {
        let value = match;
        
        // Map to standard values if available
        if (entityData.values && entityData.values[match]) {
          value = entityData.values[match];
        }
        
        extractedEntities.push({
          entity: entityType,
          value: value,
          raw: match
        });
      }
    }
  }
  
  return extractedEntities;
}

/**
 * Calculate pattern matching score
 * @param {string} pattern 
 * @param {string} message 
 * @returns {number}
 */
function calculatePatternScore(pattern, message) {
  const patternLength = pattern.length;
  const messageLength = message.length;
  
  // Longer patterns in shorter messages get higher scores
  let score = patternLength / messageLength;
  
  // Exact word matches get bonus
  const words = message.split(' ');
  if (words.includes(pattern)) {
    score += 0.3;
  }
  
  // Pattern at start of message gets bonus
  if (message.startsWith(pattern)) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Calculate overall confidence based on intent and entities
 * @param {object} intentResult 
 * @param {array} entities 
 * @param {object} context 
 * @returns {number}
 */
function calculateConfidence(intentResult, entities, context) {
  let confidence = intentResult.score;
  
  // Entity presence increases confidence
  if (entities.length > 0) {
    confidence += 0.1 * entities.length;
  }
  
  // Context continuity increases confidence
  if (context.lastIntent && context.lastIntent === intentResult.intent) {
    confidence += 0.2;
  }
  
  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Process follow-up questions based on context
 * @param {string} message 
 * @param {object} context 
 * @returns {object}
 */
function processFollowUp(message, context) {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Handle yes/no responses
  if (['yes', 'yeah', 'yep', 'sure', 'ok', 'okay'].includes(normalizedMessage)) {
    return { intent: 'confirm', confidence: 0.9 };
  }
  
  if (['no', 'nope', 'not really', 'cancel'].includes(normalizedMessage)) {
    return { intent: 'decline', confidence: 0.9 };
  }
  
  // Handle context-specific follow-ups
  if (context.lastIntent === 'exchange_rate' && normalizedMessage.includes('send')) {
    return { intent: 'send_money', confidence: 0.8 };
  }
  
  if (context.lastIntent === 'send_money' && normalizedMessage.includes('track')) {
    return { intent: 'track_transaction', confidence: 0.8 };
  }
  
  return null;
}

module.exports = {
  processMessage,
  extractIntent,
  extractEntities,
  processFollowUp
};