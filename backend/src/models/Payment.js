const { DataTypes } = require('sequelize');

function createPaymentModel(sequelize) {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Transactions',
        key: 'id'
      }
    },
    gateway: {
      type: DataTypes.ENUM('stripe', 'ozow', 'payfast', 'stitch'),
      allowNull: false
    },
    gatewayTransactionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Payments',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['gatewayTransactionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return Payment;
}

module.exports = createPaymentModel; 