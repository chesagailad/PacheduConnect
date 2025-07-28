/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: KYC - handles backend functionality
 */

const { DataTypes } = require('sequelize');

const createKYCModel = (sequelize) => {
  const KYC = sequelize.define('KYC', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    level: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold'),
      defaultValue: 'bronze',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    // Bronze level documents
    idDocument: {
      type: DataTypes.STRING, // File path/URL
      allowNull: true,
    },
    selfieWithId: {
      type: DataTypes.STRING, // File path/URL
      allowNull: true,
    },
    homeAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Silver level documents
    certifiedIdDocument: {
      type: DataTypes.STRING, // File path/URL
      allowNull: true,
    },
    proofOfAddress: {
      type: DataTypes.STRING, // File path/URL
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Verification details
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Monthly limits
    monthlySendLimit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 5000.00, // Bronze limit
    },
    currentMonthSent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    resetDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  }, {
    timestamps: true,
    hooks: {
      beforeSave: (kyc, options) => {
        // Update monthly send limit based on KYC level
        switch (kyc.level) {
          case 'bronze':
            kyc.monthlySendLimit = 5000.00;
            break;
          case 'silver':
            kyc.monthlySendLimit = 25000.00;
            break;
          case 'gold':
            kyc.monthlySendLimit = 50000.00;
            break;
        }
      }
    }
  });

  // Instance method to check if user can send amount
  KYC.prototype.canSendAmount = function(amount) {
    const now = new Date();
    const resetDate = new Date(this.resetDate);
    
    // Check if we need to reset the monthly counter
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      this.currentMonthSent = 0;
      this.resetDate = now;
    }
    
    return (this.currentMonthSent + amount) <= this.monthlySendLimit;
  };

  // Instance method to add to monthly sent amount
  KYC.prototype.addToMonthlySent = function(amount) {
    const now = new Date();
    const resetDate = new Date(this.resetDate);
    
    // Reset if it's a new month
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      this.currentMonthSent = 0;
      this.resetDate = now;
    }
    
    this.currentMonthSent += amount;
  };

  return KYC;
};

module.exports = createKYCModel; 