'use strict';

const axios = require('axios');
const { sequelize } = require('../config/database');
const codes = require('../db/models/loadedCode');
const transactions = require('../db/models/transaction');
const deliveredCodes = require('../db/models/deliveredCodes');
const vouchers = require('../db/models/voucherCodes');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendSms } = require('../utils/smsService');
const { sendWhatsAppMsg } = require('../utils/waService')
const { saveLog } = require('../utils/logs');




const processSingle = async (dbTxnId) => {
  const t = await sequelize.transaction();
  let txn;
  try {
    txn = await transactions.findByPk(dbTxnId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!txn || txn.status !== 'initiated') {
      await t.commit();
      return;
    }

    // Fetch voucher template
    const voucherTemplate = await vouchers.findOne({
      where: { codeName: txn.paymentRef },
      transaction: t
    });

    if (!voucherTemplate) {
      await saveLog('Voucher template not found', txn.transactionId, 'failed');
      txn.status = 'failed';
      txn.failureReason = 'Voucher template not found';
      await txn.save({ transaction: t });
      await t.commit();

      // Send error notification SMS
      const message = `Dear client, an error has occurred while processing your request. Please contact support ${process.env.SUPPORT_CONTACT_NUMBER}. Transaction ID: ${txn.transactionId}`;
      sendSms(txn.customerMobile, message)
        .then(() => saveLog('SMS sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('SMS failed:', txn.transactionId, 'failed', `${err.message}`));

      // Send error notification WhatsApp
      sendWhatsAppMsg(message, txn.customerMobile, txn.transactionId)
        .then(() => saveLog('WhatsApp sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('WhatsApp failed:', txn.transactionId, 'failed', `${err.message}`));

      return;
    }

    // Check Price
    const expectedAmount = voucherTemplate.codePrice * txn.qty;
    if (txn.amount < expectedAmount) {
      await saveLog('Insufficient amount', txn.transactionId, 'failed');
      txn.status = 'failed';
      txn.failureReason = `Insufficient amount. Expected at least ${expectedAmount}`;
      await txn.save({ transaction: t });
      await t.commit();

      // Send error notification SMS
      const message = `Dear client, the amount paid is insufficient for the requested voucher(s). Please WhatsApp support ${process.env.SUPPORT_CONTACT_NUMBER}. Transaction ID: ${txn.transactionId}`;
      sendSms(txn.customerMobile, message)
        .then(() => saveLog('SMS sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('SMS failed:', txn.transactionId, 'failed', `${err.message}`));

      // Send error notification WhatsApp
      sendWhatsAppMsg(message, txn.customerMobile, txn.transactionId)
        .then(() => saveLog('WhatsApp sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('WhatsApp failed:', txn.transactionId, 'failed', `${err.message}`));

      return;
    }

    if (txn.amount > expectedAmount) {
      await saveLog('Overpayment detected', txn.transactionId, 'warning');
      // Proceed but log the overpayment
    }

    // Allocate codes
    const availableCodes = await codes.findAll({
      where: { codeStatus: 'unused', codeName: txn.paymentRef },
      limit: txn.qty,
      lock: t.LOCK.UPDATE,
      skipLocked: true,
      transaction: t
    });

    if (availableCodes.length < txn.qty) {
      await saveLog('Not enough codes available', txn.transactionId, 'failed');
      txn.status = 'failed';
      txn.failureReason = 'Not enough voucher codes available';
      await txn.save({ transaction: t });
      await t.commit();

      // Send error notification SMS
      const message = `Dear client, we are out of codes for distribution. We will restock and send codes shortly. WhatsApp support ${process.env.SUPPORT_CONTACT_NUMBER}. Transaction ID: ${txn.transactionId}`;
      sendSms(txn.customerMobile, message)
        .then(() => saveLog('SMS sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('SMS failed:', txn.transactionId, 'failed', `${err.message}`));

      // Send error notification WhatsApp
      sendWhatsAppMsg(message, txn.customerMobile, txn.transactionId)
        .then(() => saveLog('WhatsApp sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('WhatsApp failed:', txn.transactionId, 'failed', `${err.message}`));

      return;
    }

    // Mark codes as used
    const deliveredRecords = availableCodes.map(code => ({
      codeId: code.codeId,
      codeName: code.codeName,
      codeType1: code.codeType1,
      codeType2: code.codeType2,
      codeStatus: 'delivered',
      customerMobile: txn.customerMobile,
      transactionId: txn.id,
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
    txn.status = 'success';
    await txn.save({ transaction: t });
    await t.commit();

    await saveLog('Single transaction processed successfully', txn.transactionId, 'success');

    // Send SMS (async, don’t block)
    availableCodes.forEach(code => {
      const message = `${voucherTemplate.codeMessage} - ${voucherTemplate.codeType1}: ${code.codeType1} ${voucherTemplate.codeType2}: ${code.codeType2} Link - ${voucherTemplate.codeLink}`;

      // Send SMS
      sendSms(txn.customerMobile, message)
        .then(() => saveLog('SMS sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('SMS failed:', txn.transactionId, 'failed', `${err.message}`));

      // Send WhatsApp
      sendWhatsAppMsg(message, txn.customerMobile, txn.transactionId)
        .then(() => saveLog('WhatsApp sent', txn.transactionId, 'success', message))
        .catch(err => saveLog('WhatsApp failed:', txn.transactionId, 'failed', `${err.message}`));
    });

  } catch (err) {
    if (txn) {
      txn.status = 'failed';
      txn.failureReason = err.message;
      await txn.save({ transaction: t }).catch(() => {});
    }
    await saveLog(`Single processing error: ${err.message}`, txn?.transactionId || 'unknown', 'failed');
    await t.rollback().catch(() => {});
  }
};

const processBulk = async (body) => {
  try {
    // Prepare payload for external API
    const payload = {
      amount: body.amount,
      password: "45a0wdRf9a6dce4505a0bd29c292842232",
      customerEmail: body.customerEmail || "",
      qty: body.qty,
      action: "bulk",
      externalTransactionId: body.externalTransactionId,
      customerMobile: body.customerMobile,
      customerName: body.customerName || "",
      transactionId: body.transactionId,
      network: body.network,
      paymentRef: body.paymentRef,
      username: "etranzact"
    };

    const response = await axios.post('https://gfbf28ff799c3ec-cdsproduction1.adb.uk-london-1.oraclecloudapps.com/ords/mawulepe/etranzact/v1/sendcode', payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.ResponseCode === '01') {
      await saveLog('Bulk transaction processed successfully', body.transactionId, 'success', JSON.stringify(response.data));
    } else {
      await saveLog('Bulk transaction failed', body.transactionId, 'failed', JSON.stringify(response.data));
    }

  } catch (error) {
    await saveLog('Error processing bulk transaction', body.transactionId, 'failed', error.response?.data ? JSON.stringify(error.response.data) : error.message);
  }
};

const processPayment = catchAsync(async (req, res, next) => {
  const body = req.body;
  const voucherQty = parseInt(body.qty, 10);

  let newTxn;

  try {
    // Log raw request body
    await saveLog('Received payment request', body.transactionId || null, 'received', JSON.stringify(body));

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
      await saveLog('Missing required fields', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Missing required fields', 404));
    }

    if (isNaN(voucherQty) || voucherQty <= 0) {
      await saveLog('Invalid quantity', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Quantity must be a positive integer', 404));
    }

    if (body.action !== 'single' && body.action !== 'bulk') {
      await saveLog('Invalid action type', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Invalid action type', 404));
    }

    if (body.amount <= 0) {
      await saveLog('Invalid amount', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Invalid amount', 404));
    }

    if (body.action === 'bulk') {
      const customerEmail = body.customerEmail;
      if (customerEmail === null || customerEmail === undefined || customerEmail.trim() === '') {
        await saveLog('Missing customer email for bulk', body.transactionId, 'failed', JSON.stringify(body));
        return next(new AppError('Customer email is required for bulk transactions', 404));
      }

      // Immediately respond success for bulk
      const message = 'Bulk transaction initiated successfully';
      res.status(200).json({
        status: 'success',
        message,
        data: {
          transactionId: body.transactionId,
          externalTransactionId: body.externalTransactionId,
        }
      });

      // Fire and forget processing
      setImmediate(async () => {
        await processBulk(body);
      });

      return;
    }

    // For single: start DB transaction
    const t = await sequelize.transaction();

    try {
      // Check for duplicate transaction
      const existingTxn = await transactions.findOne({
        where: {
          transactionId: body.transactionId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (existingTxn) {
        await saveLog('Transaction already exists', body.transactionId, 'failed', JSON.stringify(body));
        existingTxn.status = 'failed';
        existingTxn.failureReason = 'Transaction already exists';
        await existingTxn.save({ transaction: t });
        await t.commit();
        return next(new AppError('Transaction already exists', 404));
      }

      const externalTxn = await transactions.findOne({
        where: {
          externalTransactionId: body.externalTransactionId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (externalTxn) {
        await saveLog('External transaction ID already exists', body.transactionId, 'failed', JSON.stringify(body));
        externalTxn.status = 'failed';
        externalTxn.failureReason = 'External transaction ID already exists';
        await externalTxn.save({ transaction: t });
        await t.commit();
        return next(new AppError('External transaction ID already exists', 404));
      }

      // Create initial transaction
      newTxn = await transactions.create({
        transactionId: body.transactionId,
        externalTransactionId: body.externalTransactionId,
        customerName: body.customerName,
        customerMobile: body.customerMobile,
        network: body.network,
        paymentRef: body.paymentRef,
        qty: voucherQty,
        amount: body.amount,
        action: body.action,
        status: 'initiated',
        createdBy: 'system'
      }, { transaction: t });

      await t.commit();

      // Immediately respond success
      const message = 'Voucher(s) queued for delivery successfully';
      res.status(200).json({
        status: 'success',
        message,
        data: {
          transactionId: body.transactionId,
          externalTransactionId: body.externalTransactionId,
        }
      });

      // Fire and forget processing
      setImmediate(async () => {
        await processSingle(newTxn.id);
      });

      return;

    } catch (singleErr) {
      await t.rollback().catch(() => {});
      throw singleErr;
    }

  } catch (err) {
    if (newTxn) {
      // For single creation failure, but since committed after create, unlikely, but handle
      const cleanupT = await sequelize.transaction();
      try {
        newTxn.status = 'failed';
        newTxn.failureReason = err.message;
        await newTxn.save({ transaction: cleanupT });
        await cleanupT.commit();
      } catch {} finally {
        await cleanupT.rollback().catch(() => {});
      }
    }
    await saveLog(`Error: ${err.message}`, body.transactionId, 'failed');
    return next(new AppError(err.message, 500));
  }
}); 

module.exports = { processPayment };