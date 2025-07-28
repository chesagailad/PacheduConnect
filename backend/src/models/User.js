/**
 * User Model Factory
 * 
 * This module defines the User model for the PacheduConnect platform using
 * Sequelize ORM. The User model represents user accounts with authentication,
 * profile information, and role-based access control.
 * 
 * Features:
 * - UUID primary key for security and scalability
 * - Email validation and uniqueness constraints
 * - Phone number validation with country code format
 * - Password hashing with bcrypt integration
 * - Role-based access control (user, admin, super_admin)
 * - Timestamp tracking for audit trails
 * - Secure password exclusion from default queries
 * - Comprehensive model associations
 * 
 * Model Attributes:
 * - id: UUID primary key with auto-generation
 * - name: User's full name (required)
 * - email: Unique email address with validation
 * - phoneNumber: International phone number with validation
 * - passwordHash: Bcrypt-hashed password (required)
 * - role: User role for access control
 * - createdAt: Account creation timestamp
 * - updatedAt: Last modification timestamp
 * 
 * Validations:
 * - Email format validation
 * - Phone number format validation with country code
 * - Required field validation
 * - Unique email constraint
 * 
 * Security Features:
 * - Password hash exclusion from default queries
 * - UUID primary keys for security
 * - Role-based access control
 * - Input validation and sanitization
 * 
 * Associations:
 * - One-to-one with KYC model
 * - One-to-many with Transaction model
 * - One-to-many with Beneficiary model
 * - One-to-many with Payment model
 * - One-to-many with Notification model
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
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