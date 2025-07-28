/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: webhooks - handles backend functionality
 */

const express = require('express');
const crypto = require('crypto');
const { sequelize } = require('../utils/database');
const createPaymentModel = require('../models/Payment');
const createTransactionModel = require('../models/Transaction');
const createUserModel = require('../models/User');
const createNotificationModel = require('../models/Notification');

const router = express.Router();

// Stripe webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const Payment = createPaymentModel(sequelize());
    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    const Notification = createNotificationModel(sequelize());

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Find and update payment
        const payment = await Payment.findOne({
          where: { gatewayTransactionId: paymentIntent.id }
        });

        if (payment) {
          await payment.update({
            status: 'completed',
            processedAt: new Date()
          });

          // Create transaction if not exists
          const existingTransaction = await Transaction.findOne({
            where: { id: payment.transactionId }
          });

          if (!existingTransaction) {
            const user = await User.findByPk(payment.userId);
            const recipient = await User.findOne({
              where: { email: paymentIntent.metadata?.recipientEmail }
            });

            if (user && recipient) {
              const transaction = await Transaction.create({
                userId: payment.userId,
                type: 'send',
                amount: payment.amount,
                currency: payment.currency,
                recipientId: recipient.id,
                status: 'completed',
                description: payment.description
              });

              // Create receive transaction
              await Transaction.create({
                userId: recipient.id,
                type: 'receive',
                amount: payment.amount,
                currency: payment.currency,
                senderId: payment.userId,
                status: 'completed',
                description: payment.description
              });

              // Update payment with transaction ID
              await payment.update({ transactionId: transaction.id });

              // Create notifications
              await Notification.create({
                userId: payment.userId,
                type: 'payment_success',
                title: 'Payment Successful',
                message: `Your payment of ${payment.currency} ${payment.amount} has been processed successfully.`,
                data: { transactionId: transaction.id, paymentId: payment.id }
              });

              await Notification.create({
                userId: recipient.id,
                type: 'money_received',
                title: 'Money Received',
                message: `You received ${payment.currency} ${payment.amount} from ${user.name}.`,
                data: { transactionId: transaction.id, senderId: payment.userId }
              });
            }
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        
        const failedPayment = await Payment.findOne({
          where: { gatewayTransactionId: failedPaymentIntent.id }
        });

        if (failedPayment) {
          await failedPayment.update({
            status: 'failed',
            errorMessage: failedPaymentIntent.last_payment_error?.message || 'Payment failed'
          });

          // Create notification
          await Notification.create({
            userId: failedPayment.userId,
            type: 'payment_failed',
            title: 'Payment Failed',
            message: `Your payment of ${failedPayment.currency} ${failedPayment.amount} has failed. Please try again.`,
            data: { paymentId: failedPayment.id }
          });
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Ozow webhook
router.post('/ozow', express.json(), async (req, res) => {
  try {
    const { 
      TransactionId, 
      TransactionStatus, 
      Amount, 
      CurrencyCode,
      HashCheck 
    } = req.body;

    // Verify signature
    const privateKey = process.env.OZOW_PRIVATE_KEY;
    const calculatedHash = crypto
      .createHmac('sha512', privateKey)
      .update(Object.keys(req.body).sort().map(key => req.body[key]).join(''))
      .digest('hex');

    if (calculatedHash !== HashCheck) {
      console.error('Ozow webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const Payment = createPaymentModel(sequelize());
    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    const Notification = createNotificationModel(sequelize());

    const payment = await Payment.findOne({
      where: { gatewayTransactionId: TransactionId }
    });

    if (payment) {
      const newStatus = TransactionStatus === 'Complete' ? 'completed' : 
                       TransactionStatus === 'Cancelled' ? 'cancelled' : 
                       TransactionStatus === 'Error' ? 'failed' : 'processing';

      await payment.update({
        status: newStatus,
        processedAt: newStatus === 'completed' ? new Date() : null
      });

      if (newStatus === 'completed') {
        // Create transaction if not exists
        const existingTransaction = await Transaction.findOne({
          where: { id: payment.transactionId }
        });

        if (!existingTransaction) {
          const user = await User.findByPk(payment.userId);
          const recipient = await User.findOne({
            where: { email: payment.metadata?.customerEmail }
          });

          if (user && recipient) {
            const transaction = await Transaction.create({
              userId: payment.userId,
              type: 'send',
              amount: payment.amount,
              currency: payment.currency,
              recipientId: recipient.id,
              status: 'completed',
              description: payment.description
            });

            // Create receive transaction
            await Transaction.create({
              userId: recipient.id,
              type: 'receive',
              amount: payment.amount,
              currency: payment.currency,
              senderId: payment.userId,
              status: 'completed',
              description: payment.description
            });

            // Update payment with transaction ID
            await payment.update({ transactionId: transaction.id });

            // Create notifications
            await Notification.create({
              userId: payment.userId,
              type: 'payment_success',
              title: 'Payment Successful',
              message: `Your payment of ${payment.currency} ${payment.amount} has been processed successfully.`,
              data: { transactionId: transaction.id, paymentId: payment.id }
            });

            await Notification.create({
              userId: recipient.id,
              type: 'money_received',
              title: 'Money Received',
              message: `You received ${payment.currency} ${payment.amount} from ${user.name}.`,
              data: { transactionId: transaction.id, senderId: payment.userId }
            });
          }
        }
      } else if (newStatus === 'failed') {
        // Create notification for failed payment
        await Notification.create({
          userId: payment.userId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment of ${payment.currency} ${payment.amount} has failed. Please try again.`,
          data: { paymentId: payment.id }
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Ozow webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// PayFast webhook
router.post('/payfast', express.json(), async (req, res) => {
  try {
    const { 
      m_payment_id, 
      pf_payment_id, 
      payment_status, 
      amount_gross,
      amount_fee,
      amount_net,
      signature 
    } = req.body;

    // Verify signature
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const calculatedSignature = crypto
      .createHash('md5')
      .update(Object.keys(req.body).sort().map(key => `${key}=${encodeURIComponent(req.body[key])}`).join('&') + passphrase)
      .digest('hex');

    if (calculatedSignature !== signature) {
      console.error('PayFast webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const Payment = createPaymentModel(sequelize());
    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    const Notification = createNotificationModel(sequelize());

    const payment = await Payment.findOne({
      where: { gatewayTransactionId: m_payment_id }
    });

    if (payment) {
      const newStatus = payment_status === 'COMPLETE' ? 'completed' : 
                       payment_status === 'CANCELLED' ? 'cancelled' : 
                       payment_status === 'FAILED' ? 'failed' : 'processing';

      await payment.update({
        status: newStatus,
        processedAt: newStatus === 'completed' ? new Date() : null,
        metadata: {
          ...payment.metadata,
          payfastPaymentId: pf_payment_id,
          amountGross: amount_gross,
          amountFee: amount_fee,
          amountNet: amount_net
        }
      });

      if (newStatus === 'completed') {
        // Create transaction if not exists
        const existingTransaction = await Transaction.findOne({
          where: { id: payment.transactionId }
        });

        if (!existingTransaction) {
          const user = await User.findByPk(payment.userId);
          const recipient = await User.findOne({
            where: { email: payment.metadata?.customerEmail }
          });

          if (user && recipient) {
            const transaction = await Transaction.create({
              userId: payment.userId,
              type: 'send',
              amount: payment.amount,
              currency: payment.currency,
              recipientId: recipient.id,
              status: 'completed',
              description: payment.description
            });

            // Create receive transaction
            await Transaction.create({
              userId: recipient.id,
              type: 'receive',
              amount: payment.amount,
              currency: payment.currency,
              senderId: payment.userId,
              status: 'completed',
              description: payment.description
            });

            // Update payment with transaction ID
            await payment.update({ transactionId: transaction.id });

            // Create notifications
            await Notification.create({
              userId: payment.userId,
              type: 'payment_success',
              title: 'Payment Successful',
              message: `Your payment of ${payment.currency} ${payment.amount} has been processed successfully.`,
              data: { transactionId: transaction.id, paymentId: payment.id }
            });

            await Notification.create({
              userId: recipient.id,
              type: 'money_received',
              title: 'Money Received',
              message: `You received ${payment.currency} ${payment.amount} from ${user.name}.`,
              data: { transactionId: transaction.id, senderId: payment.userId }
            });
          }
        }
      } else if (newStatus === 'failed') {
        // Create notification for failed payment
        await Notification.create({
          userId: payment.userId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment of ${payment.currency} ${payment.amount} has failed. Please try again.`,
          data: { paymentId: payment.id }
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayFast webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Stitch webhook
router.post('/stitch', express.json(), async (req, res) => {
  try {
    const { 
      id, 
      status, 
      amount, 
      currency,
      reference,
      signature 
    } = req.body;

    // Verify signature (implement based on Stitch documentation)
    // const calculatedSignature = crypto.createHmac('sha256', process.env.STITCH_WEBHOOK_SECRET)
    //   .update(JSON.stringify(req.body))
    //   .digest('hex');

    // if (calculatedSignature !== signature) {
    //   console.error('Stitch webhook signature verification failed');
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }

    const Payment = createPaymentModel(sequelize());
    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    const Notification = createNotificationModel(sequelize());

    const payment = await Payment.findOne({
      where: { gatewayTransactionId: reference }
    });

    if (payment) {
      const newStatus = status === 'completed' ? 'completed' : 
                       status === 'cancelled' ? 'cancelled' : 
                       status === 'failed' ? 'failed' : 'processing';

      await payment.update({
        status: newStatus,
        processedAt: newStatus === 'completed' ? new Date() : null,
        metadata: {
          ...payment.metadata,
          stitchPaymentId: id
        }
      });

      if (newStatus === 'completed') {
        // Create transaction if not exists
        const existingTransaction = await Transaction.findOne({
          where: { id: payment.transactionId }
        });

        if (!existingTransaction) {
          const user = await User.findByPk(payment.userId);
          const recipient = await User.findOne({
            where: { email: payment.metadata?.customerEmail }
          });

          if (user && recipient) {
            const transaction = await Transaction.create({
              userId: payment.userId,
              type: 'send',
              amount: payment.amount,
              currency: payment.currency,
              recipientId: recipient.id,
              status: 'completed',
              description: payment.description
            });

            // Create receive transaction
            await Transaction.create({
              userId: recipient.id,
              type: 'receive',
              amount: payment.amount,
              currency: payment.currency,
              senderId: payment.userId,
              status: 'completed',
              description: payment.description
            });

            // Update payment with transaction ID
            await payment.update({ transactionId: transaction.id });

            // Create notifications
            await Notification.create({
              userId: payment.userId,
              type: 'payment_success',
              title: 'Payment Successful',
              message: `Your payment of ${payment.currency} ${payment.amount} has been processed successfully.`,
              data: { transactionId: transaction.id, paymentId: payment.id }
            });

            await Notification.create({
              userId: recipient.id,
              type: 'money_received',
              title: 'Money Received',
              message: `You received ${payment.currency} ${payment.amount} from ${user.name}.`,
              data: { transactionId: transaction.id, senderId: payment.userId }
            });
          }
        }
      } else if (newStatus === 'failed') {
        // Create notification for failed payment
        await Notification.create({
          userId: payment.userId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment of ${payment.currency} ${payment.amount} has failed. Please try again.`,
          data: { paymentId: payment.id }
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stitch webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router; 