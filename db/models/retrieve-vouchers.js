'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const retrieveVouchers = sequelize.define('retrieveVouchers', {
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
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'External Transaction ID is required' },
      notEmpty: { msg: 'External Transaction ID cannot be empty' }
    }
  },
  clientTransactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Client Transaction ID is required' },
      notEmpty: { msg: 'Client Transaction ID cannot be empty' }
    }
  },
  customerMobile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Customer mobile is required' },
      notEmpty: { msg: 'Customer mobile cannot be empty' }
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Amount is required' },
      isDecimal: { msg: 'Amount must be a decimal value' }
    }
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  freezeTableName: true,
  modelName: 'retrieveVouchers',
  timestamps: true,
  paranoid: false
});

module.exports = retrieveVouchers;
