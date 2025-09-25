'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('voucherCodes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codeId: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      codeName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      codePrice: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      codeStatus: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'active'
      },
      codeLink: {
        type: Sequelize.STRING(100)
      },
      codeContact: {
        type: Sequelize.STRING(15)
      },
      codeMessage: {
        type: Sequelize.STRING(300)
      },
      codeType1: {
        type: Sequelize.STRING(20)
      },
      codeType2: {
        type: Sequelize.STRING(20)
      },
      availableCodes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      distributedCodes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      updatedBy: {
        type: Sequelize.STRING(100)
      },
      codeCategory: {
        type: Sequelize.STRING(50)
      },
      bulkPurchasePrice: {
        type: Sequelize.FLOAT
      },
      minPurchaseLimit: {
        type: Sequelize.INTEGER
      },
      maxPurchaseQty: {
        type: Sequelize.INTEGER
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('voucherCodes');
  }
};

