const express = require('express');
const { processMessage } = require('./services/nlpService');
const { getSessionById, createSession, updateSession } = require('./services/sessionService');
const { getExchangeRate } = require('./services/rateService');
const { getTransactionStatus } = require('./services/transactionService');
const { getUserByEmail } = require('./services/userService');
const auth = require('./middleware/auth');

const router = express.Router();

// Chat endpoint
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await getSessionById(sessionId);
    }
    
    if (!session) {
      session = await createSession(userId);
    }

    // Process the message with NLP
    const nlpResult = await processMessage(message, session.context);
    
    // Generate response based on intent
    const response = await generateResponse(nlpResult, session, userId);
    
    // Update session context
    session.context = {
      ...session.context,
      lastIntent: nlpResult.intent,
      lastEntities: nlpResult.entities,
      conversationHistory: [
        ...(session.context.conversationHistory || []).slice(-5),
        { user: message, bot: response.text, timestamp: new Date() }
      ]
    };
    
    await updateSession(session.id, session.context);
    
    res.json({
      response: response.text,
      type: response.type,
      options: response.options,
      sessionId: session.id,
      intent: nlpResult.intent,
      confidence: nlpResult.confidence
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: 'I apologize, but I\'m experiencing technical difficulties. Please try again later or contact our support team.'
    });
  }
});

// Generate contextual response based on intent
async function generateResponse(nlpResult, session, userId) {
  const { intent, entities, confidence } = nlpResult;
  
  // Low confidence fallback
  if (confidence < 0.5) {
    return {
      text: "I'm not sure I understand. Could you please rephrase your question? You can ask me about exchange rates, transaction tracking, sending money, or KYC verification.",
      type: 'quick_reply',
      options: ['Check exchange rates', 'Track transaction', 'Send money', 'Help with KYC']
    };
  }
  
  switch (intent) {
    case 'greeting':
      return {
        text: "Hello! Welcome to Pachedu. I'm here to help you with money transfers, checking exchange rates, tracking transactions, and answering questions about our services. How can I assist you today?",
        type: 'quick_reply',
        options: ['Send money', 'Check rates', 'Track transaction', 'Account help']
      };
      
    case 'exchange_rate':
      return await handleExchangeRateIntent(entities);
      
    case 'send_money':
      return await handleSendMoneyIntent(userId);
      
    case 'track_transaction':
      return await handleTrackTransactionIntent(entities, userId);
      
    case 'kyc_help':
      return handleKYCHelp();
      
    case 'fees_info':
      return handleFeesInfo();
      
    case 'support':
      return handleSupport();
      
    case 'goodbye':
      return {
        text: "Thank you for using Pachedu! Have a great day and feel free to reach out if you need any assistance with your money transfers.",
        type: 'text'
      };
      
    default:
      return {
        text: "I understand you're asking about our services. I can help you with:\n\n• Sending money to Zimbabwe\n• Checking current exchange rates\n• Tracking your transactions\n• KYC verification process\n• Fee information\n\nWhat would you like to know more about?",
        type: 'quick_reply',
        options: ['Send money', 'Exchange rates', 'Track transaction', 'KYC help']
      };
  }
}

async function handleExchangeRateIntent(entities) {
  try {
    const fromCurrency = entities.find(e => e.entity === 'from_currency')?.value || 'ZAR';
    const toCurrency = entities.find(e => e.entity === 'to_currency')?.value || 'USD';
    
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    
    return {
      text: `Current exchange rate: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}\n\nThis rate is updated every hour. Would you like to send money or check other currency pairs?`,
      type: 'quick_reply',
      options: ['Send money now', 'Check other rates', 'View fees', 'Main menu']
    };
  } catch (error) {
    return {
      text: "I'm having trouble fetching the current exchange rates. Please try again in a moment or visit our website for the latest rates.",
      type: 'text'
    };
  }
}

async function handleSendMoneyIntent(userId) {
  if (!userId) {
    return {
      text: "To send money, you'll need to log in to your account first. Once logged in, I can guide you through the process.\n\nHere's what you'll need:\n• Recipient's details\n• Amount to send\n• Delivery method (EcoCash, Bank, Cash pickup)",
      type: 'quick_reply',
      options: ['Login/Register', 'Learn more', 'View fees', 'Main menu']
    };
  }
  
  return {
    text: "Great! I can help you send money to Zimbabwe. You can choose from several delivery options:\n\n🏦 Bank Transfer - Direct to recipient's account\n📱 EcoCash - Instant mobile wallet transfer\n💵 Cash Pickup - USD cash at agent locations\n🏠 Home Delivery - Selected areas only\n\nWould you like to start a transfer or learn more about delivery options?",
    type: 'quick_reply',
    options: ['Start transfer', 'Delivery options', 'Check fees', 'Exchange rates']
  };
}

async function handleTrackTransactionIntent(entities, userId) {
  if (!userId) {
    return {
      text: "To track your transaction, please log in to your account. Once logged in, I can help you check the status of your transfers.",
      type: 'quick_reply',
      options: ['Login/Register', 'Transaction help', 'Main menu']
    };
  }
  
  const transactionId = entities.find(e => e.entity === 'transaction_id')?.value;
  
  if (transactionId) {
    try {
      const status = await getTransactionStatus(transactionId, userId);
      return {
        text: `Transaction ${transactionId}:\nStatus: ${status.status}\nAmount: ${status.amount} ${status.currency}\nRecipient: ${status.recipientName}\nDelivery: ${status.deliveryMethod}\n\n${getStatusMessage(status.status)}`,
        type: 'quick_reply',
        options: ['View details', 'Send again', 'Get receipt', 'Main menu']
      };
    } catch (error) {
      return {
        text: "I couldn't find that transaction. Please check the transaction ID and try again, or browse your recent transactions in your account.",
        type: 'text'
      };
    }
  }
  
  return {
    text: "I can help you track your transaction. Please provide your transaction ID (it starts with 'PC' followed by numbers), or you can view all your recent transactions in your account dashboard.",
    type: 'quick_reply',
    options: ['View recent transactions', 'Enter transaction ID', 'Main menu']
  };
}

function handleKYCHelp() {
  return {
    text: "KYC (Know Your Customer) verification helps us keep transfers secure. Here's what you need:\n\n📄 Valid ID Document (Passport/ID/Driver's License)\n📱 Selfie with your ID\n🏠 Proof of Address (Utility bill/Bank statement)\n\nThe process usually takes 2-4 hours. Need help with a specific step?",
    type: 'quick_reply',
    options: ['Upload documents', 'Check KYC status', 'Document requirements', 'Contact support']
  };
}

function handleFeesInfo() {
  return {
    text: "Our competitive fees vary by amount and delivery method:\n\n💰 R0-R1000: 2.5% + R15\n💰 R1000-R5000: 2% + R25\n💰 R5000+: 1.5% + R35\n\n📱 EcoCash: Additional R10\n🏦 Bank Transfer: No extra fee\n💵 Cash Pickup: Additional R20\n\nExact fees are shown before you confirm any transfer.",
    type: 'quick_reply',
    options: ['Calculate fees', 'Send money', 'Compare methods', 'Main menu']
  };
}

function handleSupport() {
  return {
    text: "I'm here to help! For additional support:\n\n📞 Call: +27 11 123 4567\n📧 Email: support@pachedu.com\n💬 WhatsApp: +27 81 123 4567\n\nOur support team is available:\nMon-Fri: 8AM-6PM\nSat: 9AM-2PM\nSun: Closed",
    type: 'quick_reply',
    options: ['Common questions', 'Report issue', 'Account help', 'Main menu']
  };
}

function getStatusMessage(status) {
  switch (status) {
    case 'pending':
      return "Your transaction is being processed. This usually takes a few minutes.";
    case 'processing':
      return "Your money is on its way! We're coordinating with our delivery partners.";
    case 'completed':
      return "✅ Transaction completed successfully! Your recipient should have received the money.";
    case 'failed':
      return "❌ Transaction failed. Your money has been refunded. Contact support if you need assistance.";
    default:
      return "Transaction status updated.";
  }
}

module.exports = router;