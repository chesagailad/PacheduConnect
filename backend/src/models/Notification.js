/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Notification - handles backend functionality
 */

const { DataTypes } = require('sequelize');

function createNotificationModel(sequelize) {
  const Notification = sequelize.define('Notification', {
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
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Notifications',
    timestamps: true
  });

  return Notification;
}

module.exports = createNotificationModel; 