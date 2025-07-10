const createUserModel = require('./User');
const createTransactionModel = require('./Transaction');
const createNotificationModel = require('./Notification');
const createPaymentModel = require('./Payment');
const createBeneficiaryModel = require('./Beneficiary');

module.exports = {
  createUserModel,
  createTransactionModel,
  createNotificationModel,
  createPaymentModel,
  createBeneficiaryModel,
}; 