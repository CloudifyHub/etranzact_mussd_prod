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



const processPayment = catchAsync(async (req, res, next) => {
  const body = req.body;
  const qty = parseInt(body.qty, 10);
  let newTxn; // keep reference outside for error handling

  // Start DB transaction
  const t = await sequelize.transaction();

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
      return next(new AppError('Missing required fields', 400));
    }

    if (isNaN(qty) || qty <= 0) {
      await saveLog('Invalid quantity', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Quantity must be a positive integer', 400));
    }

    if (body.action !== 'single' && body.action !== 'bulk') {
      await saveLog('Invalid action type', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Invalid action type', 400));
    }

    if (body.amount <= 0) {
      await saveLog('Invalid amount', body.transactionId, 'failed', JSON.stringify(body));
      return next(new AppError('Invalid amount', 400));
    }

    if (body.action === 'single') {
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
        await saveLog('Transaction already exists', body.transactionId, 'failed', JSON.stringify(body));
        existingTxn.status = 'failed';
        existingTxn.failureReason = 'Transaction already exists';
        await existingTxn.save({ transaction: t });
        await t.commit();
        return next(new AppError('Transaction already exists', 409));
      }

      // Create initial transaction
      newTxn = await transactions.create({
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

      // Fetch voucher template
      const voucherTemplate = await vouchers.findOne({
        where: { codeName: body.paymentRef },
        transaction: t
      });

      if (!voucherTemplate) {
        await saveLog('Voucher template not found', body.transactionId, 'failed', JSON.stringify(body));
        newTxn.status = 'failed';
        newTxn.failureReason = 'Voucher template not found';
        await newTxn.save({ transaction: t });
        await t.commit();

        // Send error notification SMS
        const message = `Dear client, an error has occurred while processing your request. Please contact support ${process.env.SUPPORT_CONTACT_NUMBER}. Transaction ID: ${body.transactionId}`;
        sendSms(body.customerMobile, message)
          .then(() => saveLog('SMS sent', newTxn.transactionId, 'success', message))
          .catch(err => saveLog('SMS failed:', newTxn.transactionId, 'failed', `${err.message}`));

        // Send error notification WhatsApp
        sendWhatsAppMsg(message, body.customerMobile, body.transactionId)
          .then(() => saveLog('WhatsApp sent', newTxn.transactionId, 'success', message))
          .catch(err => saveLog('WhatsApp failed:', newTxn.transactionId, 'failed', `${err.message}`));

        return next(new AppError('Voucher template not found', 404));
      }

      // Allocate codes
      const availableCodes = await codes.findAll({
        where: { codeStatus: 'unused', codeName: body.paymentRef },
        limit: qty,
        lock: t.LOCK.UPDATE,
        skipLocked: true,
        transaction: t
      });

      if (!availableCodes || availableCodes.length < qty) {
        await saveLog('Not enough codes available', body.transactionId, 'failed', JSON.stringify(body));
        newTxn.status = 'failed';
        newTxn.failureReason = 'Not enough voucher codes available';
        await newTxn.save({ transaction: t });
        await t.commit();

        // Send error notification SMS
        const message = `Dear client, we are out of codes for delivery now. We will restock and send them to you as soon as possible. Please contact support ${process.env.SUPPORT_CONTACT_NUMBER}. Transaction ID: ${body.transactionId}`;
        sendSms(body.customerMobile, message)
          .then(() => saveLog('SMS sent', newTxn.transactionId, 'success', message))
          .catch(err => saveLog('SMS failed:', newTxn.transactionId, 'failed', `${err.message}`));

        // Send error notification WhatsApp
        sendWhatsAppMsg(message, body.customerMobile, body.transactionId)
          .then(() => saveLog('WhatsApp sent', newTxn.transactionId, 'success', message))
          .catch(err => saveLog('WhatsApp failed:', newTxn.transactionId, 'failed', `${err.message}`));

        return next(new AppError('Not enough voucher codes available', 400));
      }

      // Mark codes as used
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

      // Send SMS (async, don’t block response)
      availableCodes.forEach(code => {
        const message = `${voucherTemplate.codeMessage} - ${voucherTemplate.codeType1}: ${code.codeType1} ${voucherTemplate.codeType2}: ${code.codeType2} Link - ${voucherTemplate.codeLink}`;

        // Send SMS
        sendSms(body.customerMobile, message)
          .then(() => saveLog('SMS sent', newTxn.transactionId, 'success', message))
          .catch(err => saveLog('SMS failed:', newTxn.transactionId, 'failed', `${err.message}`));

        // Send WhatsApp
        sendWhatsAppMsg(message, body.customerMobile, body.transactionId)
          .then(() => saveLog('WhatsApp sent', newTxn.transactionId, 'success', message))
          .catch(err => saveLog('WhatsApp failed:', newTxn.transactionId, 'failed', `${err.message}`));

      });

      return res.status(200).json({
        status: 'success',
        message: 'Voucher(s) delivered successfully',
        data: {
          transactionId: body.transactionId,
          externalTransactionId: body.externalTransactionId,
          //customerMobile: body.customerMobile,
          //delivered: availableCodes.map(c => ({ code: c.codeName, codeType1: c.codeType1, codeType2: c.codeType2 }))
          //delivered: availableCodes.map(c => ({ code: c.codeName }))
        }
      });
    }

    if (body.action === 'bulk') {

      // Bulk logic placeholder

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

      try {
        const response = await axios.post('https://gfbf28ff799c3ec-cdsproduction1.adb.uk-london-1.oraclecloudapps.com/ords/mawulepe/etranzact/v1/sendcode', payload, {
          headers: { 'Content-Type': 'application/json' }
        });

       // console.log('Bulk transaction successful:', response.data);

        if (response.data.ResponseCode === '01') {
          await saveLog('Bulk transaction received for processing', body.transactionId, 'success', JSON.stringify(response.data));
          return res.status(200).json({
            status: 'success',
            message: 'Bulk transaction processed successfully',
            data: response.data
          });

        } else {
          await saveLog('Bulk transaction failed', body.transactionId, 'failed', JSON.stringify(response.data));
          return next(new AppError(response.responseDescription || 'Bulk transaction failed', 400));
        }

      } catch (error) {
        await saveLog('Error sending bulk transaction', body.transactionId, 'failed', error.message);
        return next(new AppError('Error sending bulk transaction', 500));
      }
    }

  } catch (err) {
    if (newTxn) {
      newTxn.status = 'failed';
      newTxn.failureReason = err.message;
      await newTxn.save({ transaction: t });
    }
    await saveLog(`Error: ${err.message}`, body.transactionId, 'failed');
    //await t.rollback();
    return next(new AppError(err.message, 500));
  }
});

module.exports = { processPayment };
