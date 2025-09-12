'use strict';

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Log = require('../db/models/log');


async function saveLog(log, transactionId, status, message) {
  try {
    await Log.create({
      log,
      transaction_id: transactionId,
      status,
      message
    });
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

module.exports = { saveLog };
