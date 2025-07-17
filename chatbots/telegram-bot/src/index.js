require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  logger.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
Welcome to Pachedu! 💰

I'm here to help you with:
- Check exchange rates
- Track transactions
- Get support
- Account information

Type /help to see all available commands.
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
  logger.info(`Start command from user ${msg.from.id}`);
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
Available commands:
/start - Welcome message
/help - Show this help message
/rates - Get current exchange rates
/status - Check your account status

For more assistance, contact support.
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Default message handler
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }
  
  logger.info(`Message from user ${msg.from.id}: ${msg.text}`);
  bot.sendMessage(chatId, 'Thanks for your message! Our team will get back to you soon.');
});

logger.info('Telegram Bot is running...');