'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildApiUrl } from '../config/api';
// import logger from '@/utils/logger';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'simulation' | 'escalation';
  quickReplies?: string[];
  metadata?: {
    amount?: number;
    currency?: string;
    country?: string;
    recipient?: string;
    method?: string;
    fees?: number;
    rate?: number;
    total?: number;
    escalationReason?: string;
  };
}

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ className = '' }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Sawubona! 👋 I\'m your PacheduConnect assistant. I can help you send money to Zimbabwe, Malawi, and Mozambique with real-time SMS alerts. What would you like to do today?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick-reply',
      quickReplies: [
        'Send money kumaraini 🏠',
        'Calculate fees & rates 💰',
        'Check transaction status 📊',
        'Help with documents 📋'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [conversationContext, setConversationContext] = useState<{
    lastAmount?: number;
    lastCurrency?: string;
    lastCountry?: string;
    lastMethod?: string;
    userLanguage?: string;
    escalationCount?: number;
    userPhone?: string;
    smsOptIn?: boolean;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // SMS Notification Functions
  const sendSMSNotification = async (type: string, phoneNumber: string, data: any) => {
    if (!phoneNumber || !conversationContext.smsOptIn) {
      return false;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/notifications/sms/${type}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          ...data
        })
      });

      if (response.ok) {
        const result = await response.json();
        // logger.info('SMS sent successfully via ChatBot', { 
        //   phoneNumber: data.phoneNumber?.replace(/\d(?=\d{4})/g, '*'), // Mask phone number for privacy
        //   messageLength: data.message?.length 
        // });
        return true;
      } else {
        // logger.error('Failed to send SMS via ChatBot', { 
        //   status: response.status,
        //   statusText: response.statusText 
        // });
        return false;
      }
    } catch (error) {
      // logger.error('Error sending SMS via ChatBot', error);
      return false;
    }
  };

  const sendTransactionAlert = async (transactionData: any) => {
    if (conversationContext.userPhone) {
      return await sendSMSNotification('transaction-alert', conversationContext.userPhone, { transactionData });
    }
  };

  const sendRateAlert = async (rateData: any) => {
    if (conversationContext.userPhone) {
      return await sendSMSNotification('rate-alert', conversationContext.userPhone, { rateData });
    }
  };

  const sendEscalationAlert = async (escalationData: any) => {
    if (conversationContext.userPhone) {
      return await sendSMSNotification('escalation-alert', conversationContext.userPhone, { escalationData });
    }
  };

  const sendFollowUpSMS = async (followUpData: any) => {
    if (conversationContext.userPhone) {
      return await sendSMSNotification('followup', conversationContext.userPhone, { followUpData });
    }
  };

  // Exchange rates (mock data - in real app, fetch from API)
  const exchangeRates = {
    'ZAR-USD': 0.054,
    'ZAR-ZWL': 17.32,
    'ZAR-MWK': 60.85,
    'ZAR-MZN': 3.45,
    'USD-ZWL': 320.50,
    'USD-MWK': 1125.00,
    'USD-MZN': 63.80
  };

  // Fee structures (mock data)
  const feeStructures = {
    'zimbabwe': { base: 25, percentage: 2.5, min: 25, max: 500 },
    'malawi': { base: 30, percentage: 3.0, min: 30, max: 600 },
    'mozambique': { base: 35, percentage: 3.2, min: 35, max: 700 }
  };

  // Slang and multi-language support
  const slangTranslations = {
    'kumaraini': 'to home/relatives',
    'mukoma': 'brother',
    'hanzvadzi': 'sister/relative',
    'mari': 'money',
    'dollar': 'USD',
    'rand': 'ZAR',
    'ecocash': 'EcoCash mobile money',
    'airtel': 'Airtel Money',
    'mpamba': 'TNM Mpamba',
    'mkango': 'Malawi Kwacha',
    'metical': 'Mozambican Metical'
  };

  const calculateFees = (amount: number, country: string, currency: string = 'ZAR') => {
    const feeStructure = feeStructures[country.toLowerCase() as keyof typeof feeStructures];
    if (!feeStructure) return { fee: 0, total: amount };
    
    const percentageFee = (amount * feeStructure.percentage) / 100;
    const fee = Math.max(Math.min(feeStructure.base + percentageFee, feeStructure.max), feeStructure.min);
    
    return {
      fee: Math.round(fee * 100) / 100,
      total: Math.round((amount + fee) * 100) / 100
    };
  };

  const getExchangeRate = (fromCurrency: string, toCurrency: string) => {
    const key = `${fromCurrency}-${toCurrency}`;
    return exchangeRates[key as keyof typeof exchangeRates] || 1;
  };

  const detectLanguage = (message: string): string => {
    if (message.match(/\b(sawubona|ngiyakwemukela|ngiyabonga)\b/i)) return 'zulu';
    if (message.match(/\b(mhoro|mangwanani|maswera)\b/i)) return 'shona';
    if (message.match(/\b(bom dia|obrigado|tchau)\b/i)) return 'portuguese';
    if (message.match(/\b(moni|zikomo|bwanji)\b/i)) return 'chewa';
    return 'english';
  };

  const shouldEscalate = (message: string, context: any): boolean => {
    const escalationTriggers = [
      'speak to human', 'talk to agent', 'customer service', 'manager',
      'complaint', 'fraud', 'lost money', 'stolen', 'police',
      'lawsuit', 'court', 'sue', 'refund immediately',
      'money missing', 'unauthorized transaction', 'hack'
    ];
    
    const hasEscalationTrigger = escalationTriggers.some(trigger => 
      message.toLowerCase().includes(trigger)
    );
    
    const repeatedComplaint = (context.escalationCount || 0) >= 2;
    
    return hasEscalationTrigger || repeatedComplaint;
  };

  const generateBotResponse = (userMessage: string): Message => {
    const message = userMessage.toLowerCase();
    const detectedLang = detectLanguage(message);
    
    // Update conversation context
    const amountMatch = message.match(/(?:r|zar|usd|\$)?\s*(\d+(?:\.\d{2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : conversationContext.lastAmount;
    
    const countryMatch = message.match(/\b(zimbabwe|malawi|mozambique|zim|moz)\b/i);
    const country = countryMatch ? countryMatch[1].toLowerCase() : conversationContext.lastCountry;
    
    // Handle slang translations
    let translatedMessage = message;
    Object.entries(slangTranslations).forEach(([slang, translation]) => {
      if (message.includes(slang)) {
        translatedMessage = translatedMessage.replace(slang, translation);
      }
    });

    // Check for escalation
    if (shouldEscalate(message, conversationContext)) {
      setConversationContext(prev => ({ 
        ...prev, 
        escalationCount: (prev.escalationCount || 0) + 1 
      }));
      
      // Send SMS escalation alert if user has phone number
      const ticketNumber = `PC${Date.now().toString().slice(-6)}`;
      if (conversationContext.userPhone && conversationContext.smsOptIn) {
        sendEscalationAlert({
          ticketNumber,
          estimatedWaitTime: 2,
          agentName: 'Support Team'
        });
      }
      
      return {
        id: Date.now().toString(),
        content: `🆘 I understand you need immediate assistance. I've created support ticket #${ticketNumber} and connected you with our human support team. They'll be with you within 2 minutes.${conversationContext.smsOptIn ? ' You\'ll receive an SMS confirmation shortly.' : ''}\n\nIs this about a transaction issue, account problem, or something else urgent?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'escalation',
        metadata: { escalationReason: 'User requested human agent', ticketNumber },
        quickReplies: ['Transaction issue', 'Account problem', 'Security concern', 'Other urgent matter']
      };
    }

    // Context-aware responses for follow-ups
    if (message.includes('what if') && amount && conversationContext.lastAmount) {
      const newAmount = amount;
      const targetCountry = country || conversationContext.lastCountry || 'zimbabwe';
      const { fee, total } = calculateFees(newAmount, targetCountry);
      const rate = getExchangeRate('ZAR', targetCountry === 'zimbabwe' ? 'ZWL' : targetCountry === 'malawi' ? 'MWK' : 'MZN');
      const recipientAmount = newAmount * rate;
      
      setConversationContext(prev => ({ ...prev, lastAmount: newAmount, lastCountry: targetCountry }));
      
      return {
        id: Date.now().toString(),
        content: `💰 Here's the updated calculation for R${newAmount} to ${targetCountry}:\n\n• Send Amount: R${newAmount}\n• Transfer Fee: R${fee}\n• Total Cost: R${total}\n• Recipient Gets: ${targetCountry === 'zimbabwe' ? 'ZWL' : targetCountry === 'malawi' ? 'MWK' : 'MZN'} ${recipientAmount.toFixed(2)}\n• Exchange Rate: 1 ZAR = ${rate.toFixed(4)}\n\nWould you like to proceed with this amount or try a different one?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'simulation',
        metadata: { amount: newAmount, fees: fee, rate, total, country: targetCountry },
        quickReplies: ['Send this amount', 'Try different amount', 'Compare countries', 'How to send']
      };
    }

    // Fee calculation and simulation
    if ((message.includes('calculate') || message.includes('how much') || message.includes('cost') || amountMatch) && amount) {
      const targetCountry = country || 'zimbabwe';
      const { fee, total } = calculateFees(amount, targetCountry);
      const rate = getExchangeRate('ZAR', targetCountry === 'zimbabwe' ? 'ZWL' : targetCountry === 'malawi' ? 'MWK' : 'MZN');
      const recipientAmount = amount * rate;
      
      setConversationContext(prev => ({ ...prev, lastAmount: amount, lastCountry: targetCountry }));
      
      // Send rate alert SMS if user has opted in
      if (conversationContext.userPhone && conversationContext.smsOptIn) {
        sendRateAlert({
          fromCurrency: 'ZAR',
          toCurrency: targetCountry === 'zimbabwe' ? 'ZWL' : targetCountry === 'malawi' ? 'MWK' : 'MZN',
          rate,
          amount,
          recipientAmount: recipientAmount.toFixed(2)
        });
      }
      
      return {
        id: Date.now().toString(),
        content: `💰 Cost breakdown for sending R${amount} to ${targetCountry}:\n\n✅ Send Amount: R${amount}\n✅ Transfer Fee: R${fee} (${feeStructures[targetCountry as keyof typeof feeStructures]?.percentage}% + base fee)\n✅ Total Cost: R${total}\n✅ Recipient Gets: ${targetCountry === 'zimbabwe' ? 'ZWL' : targetCountry === 'malawi' ? 'MWK' : 'MZN'} ${recipientAmount.toFixed(2)}\n✅ Exchange Rate: 1 ZAR = ${rate.toFixed(4)}\n\nThis is a simulation.${conversationContext.smsOptIn ? ' Rate details sent via SMS!' : ''} Ready to send?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'simulation',
        metadata: { amount, fees: fee, rate, total, country: targetCountry },
        quickReplies: ['Send now', 'Try different amount', 'Compare other countries', 'Get SMS alerts']
      };
    }

    // Multi-language greetings
    if (message.includes('sawubona') || message.includes('hello') || message.includes('hi') || message.includes('mhoro')) {
      const greeting = detectedLang === 'zulu' ? 'Sawubona!' : 
                      detectedLang === 'shona' ? 'Mhoro!' :
                      detectedLang === 'portuguese' ? 'Olá!' :
                      detectedLang === 'chewa' ? 'Moni!' : 'Hello!';
      
      return {
        id: Date.now().toString(),
        content: `${greeting} 👋 Welcome to PacheduConnect! I'm here to help you send money to your family kumaraini (back home). I can help with:\n\n🏠 Zimbabwe (EcoCash, bank transfer)\n🇲🇼 Malawi (Airtel Money, bank transfer) \n🇲🇿 Mozambique (mCel Money, bank transfer)\n\nWhat would you like to do today?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Send money kumaraini', 'Calculate costs', 'Check rates', 'Help with verification']
      };
    }

    // Send money process
    if (message.includes('send') || message.includes('transfer') || message.includes('kumaraini')) {
      return {
        id: Date.now().toString(),
        content: '🏠 Sending money kumaraini (home) is easy! Here\'s how:\n\n1️⃣ **Choose destination**: Zimbabwe, Malawi, or Mozambique\n2️⃣ **Enter amount**: How much ZAR to send\n3️⃣ **Recipient details**: Name, phone number, pickup method\n4️⃣ **Pay & send**: Card, EFT, or bank transfer\n5️⃣ **Done**: Family gets money in 2-5 minutes!\n\nWhich country are you sending to?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Zimbabwe 🇿🇼', 'Malawi 🇲🇼', 'Mozambique 🇲🇿', 'Compare all countries']
      };
    }

    // Country-specific information
    if (message.includes('zimbabwe') || message.includes('zim')) {
      return {
        id: Date.now().toString(),
        content: '🇿🇼 **Sending to Zimbabwe:**\n\n💰 **Receive options:**\n• EcoCash (instant)\n• Airtel Money (instant)\n• Bank transfer (2-5 mins)\n• Cash pickup (30+ locations)\n\n📱 **Popular method**: EcoCash\n💵 **Fee**: 2.5% + R25 base fee\n⏱️ **Speed**: Usually under 3 minutes\n📋 **Required**: Recipient phone number\n\nWant to calculate costs for a specific amount?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Calculate R500', 'Calculate R1000', 'Calculate R2000', 'Custom amount']
      };
    }

    if (message.includes('malawi')) {
      return {
        id: Date.now().toString(),
        content: '🇲🇼 **Sending to Malawi:**\n\n💰 **Receive options:**\n• Airtel Money (instant)\n• TNM Mpamba (instant) \n• Bank transfer (2-5 mins)\n• Cash pickup (25+ locations)\n\n📱 **Popular method**: Airtel Money\n💵 **Fee**: 3.0% + R30 base fee\n⏱️ **Speed**: Usually under 5 minutes\n📋 **Required**: Recipient phone number\n\nReady to send?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Calculate costs', 'Send now', 'Compare with Zimbabwe', 'More info']
      };
    }

    if (message.includes('mozambique') || message.includes('moz')) {
      return {
        id: Date.now().toString(),
        content: '🇲🇿 **Sending to Mozambique:**\n\n💰 **Receive options:**\n• mCel Money (instant)\n• Vodacom M-Pesa (instant)\n• Bank transfer (2-5 mins)\n• Cash pickup (20+ locations)\n\n📱 **Popular method**: mCel Money\n💵 **Fee**: 3.2% + R35 base fee\n⏱️ **Speed**: Usually under 5 minutes\n📋 **Required**: Recipient phone number\n\nLet\'s calculate your costs!',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Calculate costs', 'Send now', 'Compare countries', 'Required documents']
      };
    }

    // Exchange rates
    if (message.includes('rate') || message.includes('exchange')) {
      return {
        id: Date.now().toString(),
        content: '📊 **Current Exchange Rates** (updated hourly):\n\n🇿🇼 **Zimbabwe**: 1 ZAR = 17.32 ZWL\n🇲🇼 **Malawi**: 1 ZAR = 60.85 MWK\n🇲🇿 **Mozambique**: 1 ZAR = 3.45 MZN\n\n💡 **Pro tip**: Rates are locked when you start your transaction, so no surprises!\n\nWant to see how much your recipient will get?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Calculate R500', 'Calculate R1000', 'Calculate R2000', 'Live rate checker']
      };
    }

    // Transaction status
    if (message.includes('status') || message.includes('track') || message.includes('reference')) {
      return {
        id: Date.now().toString(),
        content: '📊 **Check Transaction Status:**\n\nI can help you track your transfer! Do you have:\n\n🔍 **Reference number** (starts with PC)\n📱 **Phone number** used for transfer\n📧 **Email confirmation**\n\n⚠️ **Note**: For real-time status, I\'ll need to connect you with our system. Would you like me to do that?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['I have reference number', 'Check by phone', 'Check by email', 'Connect to system']
      };
    }

    // KYC and documentation
    if (message.includes('document') || message.includes('verify') || message.includes('kyc') || message.includes('id')) {
      return {
        id: Date.now().toString(),
        content: '📋 **Verification Requirements:**\n\n✅ **What you need:**\n• South African ID or Passport\n• Proof of address (utility bill, bank statement)\n• Source of funds (payslip, bank statement)\n\n⏱️ **Process**: Usually approved in 2-4 hours\n💰 **Limits**: R50,000/month after verification\n🔒 **Security**: All documents encrypted\n\nNeed help with a specific document?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['ID requirements', 'Proof of address', 'Source of funds', 'Upload documents']
      };
    }

    // Troubleshooting common issues
    if (message.includes('problem') || message.includes('error') || message.includes('failed') || message.includes('stuck')) {
      setConversationContext(prev => ({ 
        ...prev, 
        escalationCount: (prev.escalationCount || 0) + 1 
      }));
      
      return {
        id: Date.now().toString(),
        content: '🔧 **Let me help troubleshoot!**\n\nCommon issues and solutions:\n\n❌ **Payment failed**: Check card details, try different card\n❌ **Recipient can\'t collect**: Verify phone number is correct\n❌ **Transfer pending**: Usually resolves in 10 minutes\n❌ **Account locked**: Need to verify documents\n\nWhat specific issue are you facing?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Payment issues', 'Recipient problems', 'Account locked', 'Speak to human']
      };
    }

    // SMS opt-in and phone number collection
    if (message.includes('sms alert') || message.includes('get sms') || message.includes('phone number') || message.includes('text me')) {
      if (!conversationContext.userPhone) {
        return {
          id: Date.now().toString(),
          content: '📱 **SMS Alerts Setup**\n\nI can send you helpful SMS notifications for:\n\n✅ Transaction confirmations\n✅ Exchange rate updates\n✅ Support ticket updates\n✅ Security alerts\n\nTo get started, please share your South African phone number (e.g., 0821234567 or +27821234567):',
          sender: 'bot',
          timestamp: new Date(),
          type: 'quick-reply',
          quickReplies: ['I\'ll type my number', 'Not right now', 'What SMS costs?', 'Privacy policy']
        };
      } else {
        setConversationContext(prev => ({ ...prev, smsOptIn: true }));
        return {
          id: Date.now().toString(),
          content: `📱 **SMS Alerts Activated!**\n\nGreat! You'll now receive SMS notifications at ${conversationContext.userPhone} for:\n\n✅ Transaction updates\n✅ Rate alerts\n✅ Support updates\n✅ Security notifications\n\n🔒 Your privacy is protected. Reply STOP to any SMS to unsubscribe.`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'quick-reply',
          quickReplies: ['Test SMS now', 'Continue chatting', 'Privacy settings', 'Send money']
        };
      }
    }

    // Test SMS functionality
    if (message.includes('test sms') && conversationContext.userPhone && conversationContext.smsOptIn) {
      // Send a test SMS
      sendSMSNotification('custom', conversationContext.userPhone, {
        message: `Hi! This is a test message from PacheduConnect. Your SMS alerts are working perfectly! 🎉`,
        context: 'test-message'
      });
      
      return {
        id: Date.now().toString(),
        content: `📱 **Test SMS Sent!**\n\nI've sent a test message to ${conversationContext.userPhone}. You should receive it within 30 seconds.\n\n✅ If you receive it: SMS alerts are working!\n❌ If you don't receive it: Check your phone number or network coverage.\n\nWhat would you like to do next?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Calculate transfer costs', 'Send money now', 'Update phone number', 'Continue chatting']
      };
    }

    // Phone number detection and validation
    const phoneMatch = message.match(/(?:\+27|0)[6-8][0-9]{8}/);
    if (phoneMatch && !conversationContext.userPhone) {
      const phoneNumber = phoneMatch[0];
      setConversationContext(prev => ({ ...prev, userPhone: phoneNumber, smsOptIn: true }));
      
      return {
        id: Date.now().toString(),
        content: `📱 **Phone Number Confirmed!**\n\nThanks! I've saved ${phoneNumber} for SMS notifications.\n\n🔔 **You'll now receive:**\n• Transaction confirmations\n• Rate alerts when you calculate costs\n• Support ticket updates\n• Important security notifications\n\n✨ Let's continue! What would you like to do?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: ['Send money now', 'Calculate costs', 'Test SMS', 'Privacy settings']
      };
    }

    // Default response with context awareness
    const contextInfo = conversationContext.lastAmount ? 
      ` I remember you were interested in sending R${conversationContext.lastAmount}${conversationContext.lastCountry ? ` to ${conversationContext.lastCountry}` : ''}.` : '';
    
    return {
      id: Date.now().toString(),
      content: `I understand you're asking about "${userMessage}".${contextInfo}\n\n🤖 **I can help you with:**\n• Sending money to Zimbabwe, Malawi, Mozambique\n• Calculating fees and exchange rates\n• Checking transaction status\n• Document verification\n• Troubleshooting issues\n${!conversationContext.smsOptIn ? '\n💬 Want SMS alerts? Just say "get SMS alerts"' : ''}\n\nWhat would you like to know more about?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick-reply',
      quickReplies: ['Send money', 'Calculate costs', 'Check rates', 'Get SMS alerts']
    };
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Capture current chat open state
    const chatIsOpen = isOpen;

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = generateBotResponse(content);

      setMessages(prev => [...prev, botResponse]);
      
      // Increment unread count if chat was closed when message was sent
      if (!chatIsOpen) {
        setUnreadCount(prev => prev + 1);
      }
      
      setIsLoading(false);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Handle escape key to close chat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        // Don't reset unread count when closing via escape - user may not have seen all messages
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            id="chatbot-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
            aria-describedby="chatbot-description"
            className="mb-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center" aria-hidden="true">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 id="chatbot-title" className="font-semibold text-sm">PacheduConnect</h3>
                  <p id="chatbot-description" className="text-xs text-primary-100">Assistant</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                aria-label="Close chat"
                className="text-white/70 hover:text-white transition-colors"
                tabIndex={0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary-600 text-white'
                        : message.type === 'escalation'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : message.type === 'simulation'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    role={message.sender === 'bot' ? 'status' : undefined}
                    aria-label={`${message.sender === 'user' ? 'Your message' : 'Assistant message'}: ${message.content}`}
                  >
                    {message.type === 'escalation' && (
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-red-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-red-600">ESCALATION</span>
                      </div>
                    )}
                    
                    {message.type === 'simulation' && (
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-green-600">SIMULATION</span>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    
                    {message.metadata && message.type === 'simulation' && (
                      <div className="mt-3 p-2 bg-white/50 rounded border text-xs">
                        <div className="font-semibold mb-1">💼 Transaction Summary:</div>
                        {message.metadata.amount && <div>Amount: R{message.metadata.amount}</div>}
                        {message.metadata.fees && <div>Fees: R{message.metadata.fees}</div>}
                        {message.metadata.total && <div>Total: R{message.metadata.total}</div>}
                        {message.metadata.rate && <div>Rate: {message.metadata.rate}</div>}
                        {message.metadata.country && <div>Destination: {message.metadata.country}</div>}
                      </div>
                    )}
                    
                    {message.quickReplies && (
                      <div className="mt-2 space-y-1" role="group" aria-label="Quick reply options">
                        {message.quickReplies.map((reply, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickReply(reply)}
                            aria-label={`Quick reply: ${reply}`}
                            className={`block w-full text-left text-xs px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 ${
                              message.sender === 'user'
                                ? 'bg-white/10 hover:bg-white/20 focus:ring-white/30'
                                : message.type === 'escalation'
                                ? 'bg-red-100 hover:bg-red-200 text-red-700 focus:ring-red-300'
                                : message.type === 'simulation'
                                ? 'bg-green-100 hover:bg-green-200 text-green-700 focus:ring-green-300'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border focus:ring-primary-300'
                            }`}
                            tabIndex={0}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg" aria-label="Assistant is typing">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex space-x-2" role="form" aria-label="Send message form">
                <label htmlFor="chat-input" className="sr-only">Type your message</label>
                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  aria-describedby="chat-input-help"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm disabled:opacity-50"
                />
                <div id="chat-input-help" className="sr-only">
                  Enter your message and press Enter or click Send to chat with the assistant
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  aria-label={isLoading ? "Sending message..." : "Send message"}
                  className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        aria-controls="chatbot-dialog"
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isOpen ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
        }`}
        tabIndex={0}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification badge for new messages when closed */}
      {!isOpen && unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
          role="status"
          aria-live="polite"
        >
          <span className="text-xs text-white font-bold" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </motion.div>
      )}
    </div>
  );
}