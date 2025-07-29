/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: index - handles backend functionality
 */

const createUserModel = require('./User');
const createTransactionModel = require('./Transaction');
const createNotificationModel = require('./Notification');
const createPaymentModel = require('./Payment');
const createBeneficiaryModel = require('./Beneficiary');
const createKYCModel = require('./KYC');

module.exports = {
  createUserModel,
  createTransactionModel,
  createNotificationModel,
  createPaymentModel,
  createBeneficiaryModel,
  createKYCModel,
}; 