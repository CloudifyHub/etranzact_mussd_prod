'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');


const voucherCodes = sequelize.define('voucherCodes', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  codeId: {
    type: DataTypes.STRING(4),
    allowNull: false,
    validate: {
      notNull: { msg: 'Code ID is required' },
      notEmpty: { msg: 'Code ID cannot be empty' }
    }
  },
  codeName: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notNull: { msg: 'Code name is required' },
      notEmpty: { msg: 'Code name cannot be empty' }
    }
  },
  codePrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: { msg: 'Code price must be a number' },
      notNull: { msg: 'Code price is required' }
    }
  },
  codeStatus: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      notNull: { msg: 'Code status is required' },
      notEmpty: { msg: 'Code status cannot be empty' }
    }
  },
  codeLink: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  codeContact: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  codeMessage: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  codeType1: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  codeType2: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  codeCategory: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  bulkPurchasePrice: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  bulkPurchaseLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maxPurchaseQty: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE
  }
}, {
  freezeTableName: true,
  modelName: 'voucherCodes',
  timestamps: true,
  paranoid: false
});

module.exports = voucherCodes;
