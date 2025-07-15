const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amountSAR: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amountZWL: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: false,
    },
    payoutMethod: {
      type: DataTypes.ENUM('ecocash', 'bank_transfer', 'cash_pickup', 'home_delivery'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
  });

  return Transaction;
}; 