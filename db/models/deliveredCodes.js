'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const deliveredCodes = sequelize.define('deliveredCodes', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  codeId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codeType1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  codeType2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  codeStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'delivered'
  },
  customerMobile: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  deliveredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deliveredBy: {
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
  }
}, {
  freezeTableName: true,
  modelName: 'deliveredCodes',
  timestamps: true,
  paranoid: false
});

module.exports = deliveredCodes;
