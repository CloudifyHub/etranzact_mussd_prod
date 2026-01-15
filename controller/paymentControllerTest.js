'use strict';

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { saveLog } = require('../utils/logs');

const processPaymentTest = catchAsync(async (req, res, next) => {
  const body = req.body;

  // ================================
  // BASIC VALIDATION (ALWAYS RUNS)
  // ================================
  if (
    !body ||
    !body.transactionId ||
    !body.externalTransactionId ||
    !body.customerMobile ||
    !body.network ||
    !body.paymentRef ||
    !body.qty ||
    !body.amount ||
    !body.action
  ) {
    await saveLog(
      'Missing required fields',
      body?.transactionId || null,
      'failed',
      JSON.stringify(body)
    );

    return next(new AppError('Missing required fields', 400));
  }

  // ================================
  // TEST / DRY-RUN MODE (NO DB WRITE)
  // ================================
  if (req.headers['x-test-mode'] === 'true') {
    await saveLog(
      'Test mode payment received',
      body.transactionId,
      'success',
      JSON.stringify(body)
    );

    console.log('Test mode payment processed:', body);

    return res.status(200).json({
      status: 'success',
      message: 'Test mode: payment validated successfully',
      data: {
        transactionId: body.transactionId,
        externalTransactionId: body.externalTransactionId,
        testMode: true
      }  
    });
  }



  // ================================
  // REAL PAYMENT LOGIC CONTINUES
  // ================================
  return next(new AppError('Live payment processing not enabled here', 501));
});

module.exports = { processPaymentTest };
