'use strict';

const faker = require('faker');  

module.exports = {
  async up(queryInterface, Sequelize) {
    const codes = [];

    const codeNames = ['BECE', 'WASSCE', 'NOVDEC'];
    const statusOptions = ['unused', 'used'];
    const updatedBys = ['SYSTEM'];

    for (let i = 1; i <= 400; i++) {
      const codeName = codeNames[Math.floor(Math.random() * codeNames.length)];
      const codeStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const updatedBy = updatedBys[Math.floor(Math.random() * updatedBys.length)];

      codes.push({
        codeId: (1000 + Math.floor(Math.random() * 100)).toString(),
        codeName: codeName,
        codeType1: faker.datatype.number({ min: 250000000000, max: 299999999999 }).toString(),
        codeType2: faker.random.alphaNumeric(12).toUpperCase(),
        codeStatus: codeStatus,
        updatedBy: updatedBy,
        createdAt: faker.date.between('2025-09-08T17:00:00', '2025-09-08T18:00:00'),
        updatedAt: faker.date.between('2025-09-09T08:00:00', '2025-09-09T12:00:00')
      });
    }

    await queryInterface.bulkInsert('loadedCodes', codes);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('loadedCodes', null, {});
  }
};
