'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      externalTransactionId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      customerMobile: {
        type: Sequelize.STRING,
        allowNull: false
      },
      network: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentRef: {
        type: Sequelize.STRING,
        allowNull: false
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'single'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      failureReason: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};
