/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Transaction - handles backend functionality
 */

const { DataTypes } = require('sequelize');

function createTransactionModel(sequelize) {
  const Transaction = sequelize.define('Transaction', {
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
    type: {
      type: DataTypes.ENUM('send', 'receive'),
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
    recipientId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Transactions',
    timestamps: true
  });

  return Transaction;
}

module.exports = createTransactionModel; 