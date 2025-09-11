'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const loadedCodes = sequelize.define('codes', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  codeId: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      notNull: { msg: 'Code ID is required' },
      notEmpty: { msg: 'Code ID cannot be empty' }
    }
  },
  codeName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notNull: { msg: 'Code name is required' },
      notEmpty: { msg: 'Code name cannot be empty' }
    }
  },
  codeType1: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  codeType2: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  codeStatus: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'active'
  },
  updatedBy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE
  }
}, {
  freezeTableName: true,
  modelName: 'codes',
  timestamps: true,
  paranoid: false
});

module.exports = loadedCodes;
