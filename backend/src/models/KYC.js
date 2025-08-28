/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: KYC model factory - defines KYC levels and verification status
 */

const { DataTypes } = require('sequelize');

/**
 * Create KYC Model
 * 
 * Factory function that creates and configures the KYC model
 * with all necessary attributes, validations, and associations.
 * 
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} Configured KYC model
 */
const createKYCModel = (sequelize) => {
  if (!sequelize) {
    throw new Error('Sequelize instance is required');
  }

  // Check if KYC model is already defined and return it immediately
  if (sequelize.models.KYC) {
    return sequelize.models.KYC;
  }

  const KYC = sequelize.define('KYC', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
      allowNull: false,
      defaultValue: 'bronze',
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    // Bronze level documents
    idDocument: {
      type: DataTypes.STRING, // File path/URL
      allowNull: true,
    },
    selfie: {
      type: DataTypes.STRING, // File path/URL
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

  // Define associations only if KYC model is properly defined
  if (KYC) {
    // Instance method to check if user can send amount
    KYC.prototype.canSendAmount = function(amount) {
      const now = new Date();
      const resetDate = new Date(this.resetDate);
      
      // Coerce values to numbers with fallback to 0
      const currentMonthSent = Number(this.currentMonthSent) || 0;
      const monthlySendLimit = Number(this.monthlySendLimit) || 0;
      const amountNum = Number(amount) || 0;
      
      // Check if we need to reset the monthly counter
      if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        this.currentMonthSent = 0;
        this.resetDate = now;
        return amountNum <= monthlySendLimit;
      }
      
      return (currentMonthSent + amountNum) <= monthlySendLimit;
    };

    // Instance method to add to monthly sent amount
    KYC.prototype.addToMonthlySent = function(amount) {
      const now = new Date();
      const resetDate = new Date(this.resetDate);
      
      // Coerce values to numbers with fallback to 0
      const currentMonthSent = Number(this.currentMonthSent) || 0;
      const amountNum = Number(amount) || 0;
      
      // Reset if it's a new month
      if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        this.currentMonthSent = 0;
        this.resetDate = now;
      } else {
        // Update with coerced numeric values
        this.currentMonthSent = currentMonthSent + amountNum;
      }
    };

    KYC.associate = (models) => {
      if (models.User) {
        KYC.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user'
        });
      }
      if (models.User) {
        KYC.belongsTo(models.User, {
          foreignKey: 'verifiedBy',
          as: 'verifier'
        });
      }
    };
  }

  return KYC;
};

module.exports = createKYCModel; 