/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: User model factory - defines user accounts with authentication and role-based access control
 */

const { DataTypes } = require('sequelize');

/**
 * Create User Model
 * 
 * Factory function that creates and configures the User model
 * with all necessary attributes, validations, and associations.
 * 
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} Configured User model
 */
const createUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidPhoneNumber(value) {
          if (value && value !== '' && value !== null) {
            // Check for valid phone number format with country code
            if (!/^\+[1-9]\d{8,14}$/.test(value)) {
              throw new Error('Invalid phone number format');
            }
          }
        },
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'super_admin'),
      defaultValue: 'user',
      allowNull: false,
    },
  }, {
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      }
    }
  });

  // Define associations
  User.associate = (models) => {
    User.hasOne(models.KYC, {
      foreignKey: 'userId',
      as: 'kyc'
    });
    User.hasMany(models.Transaction, {
      foreignKey: 'userId',
      as: 'transactions'
    });
    User.hasMany(models.Beneficiary, {
      foreignKey: 'userId',
      as: 'beneficiaries'
    });
  };

  return User;
};

module.exports = createUserModel; 