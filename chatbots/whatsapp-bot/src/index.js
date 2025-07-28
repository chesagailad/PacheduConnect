/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: index - handles backend functionality
 */

require('dotenv').config();
const express = require('express');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 8000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'whatsapp-bot' });
});

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  logger.info('Received webhook:', JSON.stringify(req.body, null, 2));
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  logger.info(`WhatsApp Bot running on port ${PORT}`);
});