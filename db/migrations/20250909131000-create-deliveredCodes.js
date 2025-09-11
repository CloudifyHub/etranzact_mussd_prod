'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deliveredCodes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codeId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      codeName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      codeType1: {
        type: Sequelize.STRING,
        allowNull: false
      },
      codeType2: {
        type: Sequelize.STRING,
        allowNull: false
      },
      codeStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'delivered'
      },
      customerMobile: {
        type: Sequelize.STRING,
        allowNull: false
      },
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      deliveredAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      deliveredBy: {
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
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('deliveredCodes');
  }
};
