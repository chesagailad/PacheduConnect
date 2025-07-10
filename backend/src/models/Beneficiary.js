const { DataTypes } = require('sequelize');

const createBeneficiaryModel = (sequelize) => {
  const Beneficiary = sequelize.define('Beneficiary', {
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
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidPhoneNumber(value) {
          if (value && value !== '') {
            if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
              throw new Error('Invalid phone number format');
            }
          }
        },
      },
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountType: {
      type: DataTypes.ENUM('savings', 'checking', 'current'),
      allowNull: true,
    },
    swiftCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    routingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'Beneficiaries',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['email'],
      },
      {
        fields: ['phoneNumber'],
      },
    ],
  });

  // Define associations
  Beneficiary.associate = (models) => {
    Beneficiary.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Beneficiary;
};

module.exports = createBeneficiaryModel; 