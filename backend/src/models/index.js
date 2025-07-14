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