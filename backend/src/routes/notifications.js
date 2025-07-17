const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');
const { logger } = require('../utils/logger');

// Middleware for basic validation
const validatePhoneNumber = (req, res, next) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  // Basic South African phone number validation
  const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid South African phone number format' });
  }
  
  next();
};

// Send transaction status alert
router.post('/sms/transaction-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, transactionData } = req.body;
    
    const result = await smsService.sendTransactionAlert(phoneNumber, transactionData);
    
    logger.info(`Transaction alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      reference: transactionData.reference
    });
    
    res.json({
      success: true,
      message: 'Transaction alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send transaction alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send exchange rate alert
router.post('/sms/rate-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, rateData } = req.body;
    
    const result = await smsService.sendExchangeRateAlert(phoneNumber, rateData);
    
    logger.info(`Rate alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      rate: `${rateData.fromCurrency}-${rateData.toCurrency}: ${rateData.rate}`
    });
    
    res.json({
      success: true,
      message: 'Rate alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send rate alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send document status alert
router.post('/sms/document-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, docData } = req.body;
    
    const result = await smsService.sendDocumentAlert(phoneNumber, docData);
    
    logger.info(`Document alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      documentType: docData.documentType,
      status: docData.status
    });
    
    res.json({
      success: true,
      message: 'Document alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send document alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send security alert
router.post('/sms/security-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, alertData } = req.body;
    
    const result = await smsService.sendSecurityAlert(phoneNumber, alertData);
    
    logger.info(`Security alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      alertType: alertData.alertType
    });
    
    res.json({
      success: true,
      message: 'Security alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send security alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send escalation alert (when user is escalated to human agent)
router.post('/sms/escalation-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, escalationData } = req.body;
    
    const result = await smsService.sendEscalationAlert(phoneNumber, escalationData);
    
    logger.info(`Escalation alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      ticketNumber: escalationData.ticketNumber
    });
    
    res.json({
      success: true,
      message: 'Escalation alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send escalation alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send chatbot follow-up message
router.post('/sms/followup', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, followUpData } = req.body;
    
    const result = await smsService.sendChatbotFollowUp(phoneNumber, followUpData);
    
    logger.info(`Follow-up SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      query: followUpData.query
    });
    
    res.json({
      success: true,
      message: 'Follow-up SMS sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send follow-up SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send promotional alert
router.post('/sms/promo-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, promoData } = req.body;
    
    const result = await smsService.sendPromoAlert(phoneNumber, promoData);
    
    logger.info(`Promo alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      discount: promoData.discount
    });
    
    res.json({
      success: true,
      message: 'Promotional alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send promo alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Send maintenance alert
router.post('/sms/maintenance-alert', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, maintenanceData } = req.body;
    
    const result = await smsService.sendMaintenanceAlert(phoneNumber, maintenanceData);
    
    logger.info(`Maintenance alert SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      service: maintenanceData.service
    });
    
    res.json({
      success: true,
      message: 'Maintenance alert sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send maintenance alert SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

// Generic SMS endpoint for custom messages
router.post('/sms/custom', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber, message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const result = await smsService.sendSMS(phoneNumber, message);
    
    logger.info(`Custom SMS sent to ${phoneNumber}`, {
      messageId: result.messageId,
      context: context || 'chatbot-custom'
    });
    
    res.json({
      success: true,
      message: 'SMS sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    logger.error('Failed to send custom SMS:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification' 
    });
  }
});

module.exports = router;