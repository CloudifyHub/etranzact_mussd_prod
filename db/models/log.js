'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Logs = sequelize.define('logs', {

  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  log: {
    type: DataTypes.STRING(5000),
    allowNull: true
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  message: {
    type: DataTypes.STRING(5000),
    allowNull: true
  }
}, {
  freezeTableName: true,
  modelName: 'logs',
  timestamps: true,
  paranoid: false
});

module.exports = Logs;
