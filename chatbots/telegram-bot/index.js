/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: index - handles backend functionality
 */

const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

// Bot configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://backend:5000';

if (!BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// User sessions (in production, use Redis)
const userSessions = new Map();

// Bot commands
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const userName = ctx.from.first_name || ctx.from.username || 'there';
  
  console.log(`New user started: ${userName} (${chatId})`);
  
  const welcomeMessage = `Hello ${userName}! 👋\n\nWelcome to Pachedu - your trusted partner for sending money from South Africa to Zimbabwe.\n\n🌟 What I can help you with:\n• Check current exchange rates\n• Track your transactions\n• Guide you through sending money\n• Answer questions about our services\n• Help with KYC verification\n\nHow can I assist you today?`;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💱 Exchange Rates', 'rates')],
    [Markup.button.callback('💸 Send Money', 'send')],
    [Markup.button.callback('📋 Track Transaction', 'track')],
    [Markup.button.callback('🆔 KYC Help', 'kyc')]
  ]);
  
  await ctx.reply(welcomeMessage, keyboard);
});

bot.help(async (ctx) => {
  const helpMessage = `🤖 Pachedu Bot Help\n\n📋 Available Commands:\n/start - Welcome message and main menu\n/rates - Check exchange rates\n/send - Start money transfer\n/track - Track transaction\n/kyc - KYC verification help\n/help - Show this help message\n\n💬 You can also chat with me naturally! Just type your question.\n\n📞 Need human help?\n• Website: pachedu.com\n• Email: support@pachedu.com\n• Phone: +27 11 123 4567`;
  
  await ctx.reply(helpMessage);
});

// Handle text messages
bot.on('text', async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const message = ctx.message.text;
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    console.log(`Message from ${userName} (${chatId}): ${message}`);
    
    // Get or create user session
    let session = userSessions.get(chatId);
    if (!session) {
      session = {
        chatId: chatId,
        userName: userName,
        sessionId: null,
        context: {},
        lastActivity: new Date()
      };
      userSessions.set(chatId, session);
    }
    
    // Update last activity
    session.lastActivity = new Date();
    
    // Show typing indicator
    await ctx.sendChatAction('typing');
    
    // Send message to backend chatbot service
    const chatbotResponse = await sendToChatbot(message, session);
    
    // Send response back to Telegram
    if (chatbotResponse) {
      await sendTelegramResponse(ctx, chatbotResponse);
    }
    
  } catch (error) {
    console.error('Error handling text message:', error);
    await ctx.reply('Sorry, I encountered an error. Please try again later. 😅');
  }
});

// Handle callback queries (inline keyboard buttons)
bot.on('callback_query', async (ctx) => {
  try {
    const action = ctx.callbackQuery.data;
    const chatId = ctx.chat.id;
    
    console.log(`Callback query from ${chatId}: ${action}`);
    
    await ctx.answerCbQuery();
    
    // Map callback actions to text messages
    const actionMap = {
      'rates': 'Check exchange rates',
      'send': 'Send money',
      'track': 'Track transaction',
      'kyc': 'Help with KYC'
    };
    
    const message = actionMap[action] || action;
    
    // Process as if it was a text message
    let session = userSessions.get(chatId);
    if (!session) {
      session = {
        chatId: chatId,
        userName: ctx.from.first_name || ctx.from.username || 'User',
        sessionId: null,
        context: {},
        lastActivity: new Date()
      };
      userSessions.set(chatId, session);
    }
    
    session.lastActivity = new Date();
    
    await ctx.sendChatAction('typing');
    
    const chatbotResponse = await sendToChatbot(message, session);
    
    if (chatbotResponse) {
      await sendTelegramResponse(ctx, chatbotResponse);
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    await ctx.reply('Sorry, I encountered an error. Please try again later. 😅');
  }
});

// Send message to backend chatbot service
async function sendToChatbot(message, session) {
  try {
    const response = await axios.post(`${API_URL}/api/chatbot/message`, {
      message: message,
      sessionId: session.sessionId,
      platform: 'telegram',
      userTelegramId: session.chatId,
      userName: session.userName
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    // Update session ID if provided
    if (response.data.sessionId) {
      session.sessionId = response.data.sessionId;
      userSessions.set(session.chatId, session);
    }
    
    return response.data;
    
  } catch (error) {
    console.error('Error communicating with chatbot service:', error);
    return {
      response: 'Sorry, I\'m having trouble processing your request. Please try again later. 🤖'
    };
  }
}

// Send response to Telegram with formatting
async function sendTelegramResponse(ctx, chatbotData) {
  try {
    let message = chatbotData.response || chatbotData.text;
    
    // Add emojis for better UX
    message = enhanceMessageWithEmojis(message);
    
    // Create inline keyboard if options are provided
    if (chatbotData.options && chatbotData.options.length > 0) {
      const buttons = chatbotData.options.map((option, index) => 
        [Markup.button.callback(`${index + 1}. ${option}`, `option_${index}_${option.toLowerCase().replace(/\s+/g, '_')}`)]
      );
      
      const keyboard = Markup.inlineKeyboard(buttons);
      await ctx.reply(message, keyboard);
    } else {
      await ctx.reply(message);
    }
    
  } catch (error) {
    console.error('Error sending Telegram response:', error);
    await ctx.reply('Sorry, I encountered an error sending the response. 😅');
  }
}

// Enhance messages with relevant emojis
function enhanceMessageWithEmojis(message) {
  return message
    .replace(/exchange rate/gi, '💱 Exchange rate')
    .replace(/send money/gi, '💸 Send money')
    .replace(/track/gi, '📋 Track')
    .replace(/KYC/gi, '🆔 KYC')
    .replace(/document/gi, '📄 Document')
    .replace(/completed/gi, '✅ Completed')
    .replace(/failed/gi, '❌ Failed')
    .replace(/pending/gi, '⏳ Pending')
    .replace(/processing/gi, '⚡ Processing')
    .replace(/EcoCash/gi, '📱 EcoCash')
    .replace(/bank transfer/gi, '🏦 Bank transfer')
    .replace(/cash pickup/gi, '💵 Cash pickup')
    .replace(/support/gi, '🆘 Support')
    .replace(/help/gi, '💡 Help');
}

// Command handlers
bot.command('rates', async (ctx) => {
  await ctx.sendChatAction('typing');
  const session = getOrCreateSession(ctx);
  const response = await sendToChatbot('Check exchange rates', session);
  if (response) {
    await sendTelegramResponse(ctx, response);
  }
});

bot.command('send', async (ctx) => {
  await ctx.sendChatAction('typing');
  const session = getOrCreateSession(ctx);
  const response = await sendToChatbot('Send money', session);
  if (response) {
    await sendTelegramResponse(ctx, response);
  }
});

bot.command('track', async (ctx) => {
  await ctx.sendChatAction('typing');
  const session = getOrCreateSession(ctx);
  const response = await sendToChatbot('Track transaction', session);
  if (response) {
    await sendTelegramResponse(ctx, response);
  }
});

bot.command('kyc', async (ctx) => {
  await ctx.sendChatAction('typing');
  const session = getOrCreateSession(ctx);
  const response = await sendToChatbot('Help with KYC', session);
  if (response) {
    await sendTelegramResponse(ctx, response);
  }
});

// Helper function to get or create session
function getOrCreateSession(ctx) {
  const chatId = ctx.chat.id;
  let session = userSessions.get(chatId);
  
  if (!session) {
    session = {
      chatId: chatId,
      userName: ctx.from.first_name || ctx.from.username || 'User',
      sessionId: null,
      context: {},
      lastActivity: new Date()
    };
    userSessions.set(chatId, session);
  }
  
  session.lastActivity = new Date();
  return session;
}

// Clean up inactive sessions every 30 minutes
setInterval(() => {
  const now = new Date();
  const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
  
  for (const [chatId, session] of userSessions.entries()) {
    if (now - session.lastActivity > maxInactiveTime) {
      userSessions.delete(chatId);
      console.log(`Cleaned up inactive session for ${chatId}`);
    }
  }
}, 30 * 60 * 1000);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Sorry, something went wrong. Please try again. 🤖');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start bot
bot.launch().then(() => {
  console.log('🤖 Pachedu Telegram Bot started successfully!');
  console.log(`Bot username: @${bot.botInfo.username}`);
  console.log(`Active sessions: ${userSessions.size}`);
}).catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

module.exports = bot;