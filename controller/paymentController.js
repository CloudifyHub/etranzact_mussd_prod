'use strict';

const { sequelize } = require('../config/database');
const codes = require('../db/models/loadedCode');
const transactions = require('../db/models/transaction');
const deliveredCodes = require('../db/models/deliveredCodes');
const vouchers = require('../db/models/voucherCodes');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendSms } = require('../utils/smsService');

const processPayment = catchAsync(async (req, res, next) => {
  const body = req.body;
  const qty = parseInt(body.qty, 10);

  // Start DB transaction
  const t = await sequelize.transaction();

  try {
    // Check for duplicate transaction
    const existingTxn = await transactions.findOne({
      where: {
        transactionId: body.transactionId,
        externalTransactionId: body.externalTransactionId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (existingTxn) {
      newTxn.status = 'failed';
      newTxn.failureReason = 'Transaction already exists';
      await newTxn.save({ transaction: t });
      await t.commit();
      return next(new AppError('Transaction already exists', 409));
    }

    // Create initial transaction log (always)
    const newTxn = await transactions.create({
        transactionId: body.transactionId,
        externalTransactionId: body.externalTransactionId,
        customerName: body.customerName,
        customerMobile: body.customerMobile,
        network: body.network,
        paymentRef: body.paymentRef,
        qty: qty,
        amount: body.amount,
        action: body.action,
        status: 'initiated',
        createdBy: 'system'
    }, { transaction: t });

    if (!newTxn) {
      return next(new AppError('Failed to create transaction', 500));
    }
    
    // Fetch voucher template
    const voucherTemplate = await vouchers.findOne({
      where: { codeName: body.paymentRef },
      transaction: t
    });


    if (!voucherTemplate) {
      newTxn.status = 'failed';
      newTxn.failureReason = 'Voucher template not found';
      await newTxn.save({ transaction: t });
      await t.commit();
      return next(new AppError('Voucher template not found', 404));
    }

    // Allocate codes safely
    const availableCodes = await codes.findAll({
      where: { codeStatus: 'unused', codeName: body.paymentRef },
      limit: qty,
      lock: t.LOCK.UPDATE,
      skipLocked: true,
      transaction: t
    });

    if (!availableCodes || availableCodes.length < qty) {
      newTxn.status = 'failed';
      newTxn.failureReason = 'Not enough voucher codes available';
      await newTxn.save({ transaction: t });
      await t.commit();
      return next(new AppError('Not enough voucher codes available', 400));
    }

    // Mark codes as used & log delivered codes
    const deliveredRecords = availableCodes.map(code => ({
      codeId: code.codeId,
      codeName: code.codeName,
      codeType1: code.codeType1,
      codeType2: code.codeType2,
      codeStatus: 'delivered',
      customerMobile: body.customerMobile,
      transactionId: newTxn.id,
      deliveredBy: 'system'
    }));

    await Promise.all(
      availableCodes.map(code => {
        code.codeStatus = 'used';
        code.updatedBy = 'system';
        return code.save({ transaction: t });
      })
    );

    await deliveredCodes.bulkCreate(deliveredRecords, { transaction: t });

    // Mark transaction as success
    newTxn.status = 'success';
    await newTxn.save({ transaction: t });
    await t.commit();

    // Send SMS in parallel (non-blocking)
    // const smsPromises = availableCodes.map(code => {
    //   const message = `TEST ${voucherTemplate.codeMessage} - ${voucherTemplate.codeType1}: ${code.codeType1} ${voucherTemplate.codeType2}: ${code.codeType2} Link - ${voucherTemplate.codeLink}`;
    //   return sendSms(body.customerMobile, message).catch(err => console.error('SMS failed', err));
    // });

    // await Promise.all(smsPromises); // optional

    return res.status(200).json({
      status: 'success',
      message: 'Voucher(s) delivered successfully',
      data: {
        transactionId: body.transactionId,
        externalTransactionId: body.externalTransactionId,
        customerMobile: body.customerMobile,
        delivered: availableCodes.map(c => ({ code: c.codeName }))
      }
    });

  } catch (err) {
    // On unexpected error, mark transaction failed but keep record
    newTxn.status = 'failed';
    newTxn.failureReason = err.message;
    await newTxn.save({ transaction: t });
    await t.commit();
    return next(new AppError(err.message, 500));
  }
});

module.exports = { processPayment };
