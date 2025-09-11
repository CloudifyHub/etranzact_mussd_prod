'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const transactions = sequelize.define('transactions', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Transaction ID is required' },
      notEmpty: { msg: 'Transaction ID cannot be empty' }
    }
  },
  externalTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerMobile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Customer mobile is required' },
      notEmpty: { msg: 'Customer mobile cannot be empty' }
    }
  },
  network: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentRef: {
    type: DataTypes.STRING,
    allowNull: false
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'single'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE
  },  
  failureReason: {
        type: DataTypes.STRING,
        allowNull: true
  }
}, {
  freezeTableName: true,
  modelName: 'transactions',
  timestamps: true,
  paranoid: false
});

module.exports = transactions;
