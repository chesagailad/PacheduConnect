const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// WhatsApp API configuration
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const API_URL = process.env.API_URL || 'http://backend:5000';

// Middleware
app.use(bodyParser.json());

// User sessions for WhatsApp (in production, use Redis)
const userSessions = new Map();

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Webhook handler for incoming messages
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes;
        
        changes.forEach(async (change) => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            if (messages) {
              for (const message of messages) {
                await handleIncomingMessage(message, change.value);
              }
            }
          }
        });
      });

      res.status(200).send('OK');
    } else {
      res.status(404).send('Not found');
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Handle incoming WhatsApp messages
async function handleIncomingMessage(message, value) {
  try {
    const from = message.from;
    const messageText = message.text?.body;
    const messageType = message.type;

    // Only handle text messages for now
    if (messageType !== 'text' || !messageText) {
      return;
    }

    console.log(`Received message from ${from}: ${messageText}`);

    // Get or create user session
    let session = userSessions.get(from);
    if (!session) {
      session = {
        phoneNumber: from,
        sessionId: null,
        context: {},
        lastActivity: new Date()
      };
      userSessions.set(from, session);
    }

    // Update last activity
    session.lastActivity = new Date();

    // Send message to backend chatbot service
    const chatbotResponse = await sendToChatbot(messageText, session);

    // Send response back to WhatsApp
    if (chatbotResponse) {
      await sendWhatsAppMessage(from, chatbotResponse);
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await sendWhatsAppMessage(message.from, 'Sorry, I encountered an error. Please try again later.');
  }
}

// Send message to backend chatbot service
async function sendToChatbot(message, session) {
  try {
    const response = await axios.post(`${API_URL}/api/chatbot/message`, {
      message: message,
      sessionId: session.sessionId,
      platform: 'whatsapp',
      userPhone: session.phoneNumber
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Update session ID if provided
    if (response.data.sessionId) {
      session.sessionId = response.data.sessionId;
      userSessions.set(session.phoneNumber, session);
    }

    return formatResponseForWhatsApp(response.data);

  } catch (error) {
    console.error('Error communicating with chatbot service:', error);
    return 'Sorry, I\'m having trouble processing your request. Please try again later.';
  }
}

// Format chatbot response for WhatsApp
function formatResponseForWhatsApp(chatbotData) {
  let response = chatbotData.response || chatbotData.text;

  // Add quick reply options if available
  if (chatbotData.options && chatbotData.options.length > 0) {
    response += '\n\nOptions:';
    chatbotData.options.forEach((option, index) => {
      response += `\n${index + 1}. ${option}`;
    });
    response += '\n\nReply with the number of your choice or type your message.';
  }

  return response;
}

// Send message to WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Message sent to ${to}: ${message.substring(0, 50)}...`);
    return response.data;

  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

// Clean up inactive sessions every 30 minutes
setInterval(() => {
  const now = new Date();
  const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

  for (const [phoneNumber, session] of userSessions.entries()) {
    if (now - session.lastActivity > maxInactiveTime) {
      userSessions.delete(phoneNumber);
      console.log(`Cleaned up inactive session for ${phoneNumber}`);
    }
  }
}, 30 * 60 * 1000);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'pachedu-whatsapp-bot',
    timestamp: new Date().toISOString(),
    activeSessions: userSessions.size
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pachedu WhatsApp Bot running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
  
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !VERIFY_TOKEN) {
    console.warn('Warning: WhatsApp configuration incomplete. Please set environment variables.');
  }
});

module.exports = app;