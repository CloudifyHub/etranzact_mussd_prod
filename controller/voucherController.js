'use strict';

const vouchers = require('../db/models/voucherCodes');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendSms } = require('../utils/smsService');
const { sendWhatsAppMsg } = require('../utils/waService')
const { saveLog } = require('../utils/logs');
const transactions = require('../db/models/transaction');
const deliveredCodes = require('../db/models/deliveredCodes');
const retrieveVouchers = require('../db/models/retrieve-vouchers');


// Create a voucher
const createVoucher = catchAsync(async (req, res, next) => {
    const body = req.body;

    if (!body) {
        return next(new AppError('No data provided', 400));
    }

    if (!body.codeId || !body.codeName || !body.codePrice || !body.codeStatus) {
        return next(new AppError('Required fields: codeId, codeName, codePrice, codeStatus', 400));
    }

    const existingVoucher = await vouchers.findOne({ where: { codeId: body.codeId } });

    if (existingVoucher) {
        return next(new AppError('Voucher with this codeId already exists', 400));
    }

    const newVoucher = await vouchers.create({
        codeId: body.codeId,
        codeName: body.codeName,
        codePrice: body.codePrice,
        codeStatus: body.codeStatus,
        codeLink: body.codeLink || null,
        codeContact: body.codeContact || null,
        codeMessage: body.codeMessage || null,
        codeType1: body.codeType1 || null,
        codeType2: body.codeType2 || null,
        codeCategory: body.codeCategory || null,
        bulkPurchasePrice: body.bulkPurchasePrice || null,
        bulkPurchaseLimit: body.bulkPurchaseLimit || null,
        maxPurchaseQty: body.maxPurchaseQty || null
    });

    if (!newVoucher) {
        return next(new AppError('Failed to create voucher', 400));
    }

    return res.status(201).json({
        status: 'success',
        message: 'Voucher created successfully',
        data: newVoucher
    });
});


// Get all vouchers
const getAllVouchers = catchAsync(async (req, res, next) => {
    const result = await vouchers.findAll();

    if (!result || result.length === 0) {
        return next(new AppError('No vouchers found', 404));
    }

    return res.status(200).json({
        status: 'success',
        message: 'Vouchers fetched successfully',
        data: result
    });
});



// Get voucher by ID
const getVoucherById = catchAsync(async (req, res, next) => {
    const vendorId = req.params.id;
    const result = await vouchers.findByPk(vendorId);

    console.log(vendorId);

    if (!result) {
        return next(new AppError('Voucher not found', 404));
    }

    return res.status(200).json({
        status: 'success',
        data: result
    });
});


// Update a voucher
const updateVoucher = catchAsync(async (req, res, next) => {
    const vendorId = req.params.id;
    const body = req.body;

    if (!vendorId) {
        return next(new AppError('Voucher ID is required', 400));
    }

    const result = await vouchers.findOne({ where: { id: vendorId } });

    if (!result) {
        return next(new AppError('Voucher not found', 404));
    }

    result.codeId = body.codeId || result.codeId;
    result.codeName = body.codeName || result.codeName;
    result.codePrice = body.codePrice || result.codePrice;
    result.codeStatus = body.codeStatus || result.codeStatus;
    result.codeLink = body.codeLink || result.codeLink;
    result.codeContact = body.codeContact || result.codeContact;
    result.codeMessage = body.codeMessage || result.codeMessage;
    result.codeType1 = body.codeType1 || result.codeType1;
    result.codeType2 = body.codeType2 || result.codeType2;
    result.codeCategory = body.codeCategory || result.codeCategory;
    result.bulkPurchasePrice = body.bulkPurchasePrice || result.bulkPurchasePrice;
    result.bulkPurchaseLimit = body.bulkPurchaseLimit || result.bulkPurchaseLimit;
    result.maxPurchaseQty = body.maxPurchaseQty || result.maxPurchaseQty;
    result.updatedBy = req.user ? req.user.id : result.updatedBy;

    const updatedVoucher = await result.save();

    if (!updatedVoucher) {
        return next(new AppError('Failed to update voucher', 400));
    }

    return res.status(200).json({
        status: 'success',
        message: 'Voucher updated successfully',
        data: updatedVoucher
    });
});


// Delete a voucher
const deleteVoucher = catchAsync(async (req, res, next) => {
    const vendorId = req.params.id;
    const result = await vouchers.findByPk(vendorId);
    console.log(vendorId);

    if (!result) {
        return next(new AppError('Voucher not found', 404));
    }

    await result.destroy();

    return res.status(200).json({
        status: 'success',
        message: 'Voucher deleted successfully'
    });
});



// Get all vouchers by category
const getAllVoucherByCategory = catchAsync(async (req, res, next) => {
    const codeCategory = req.params.category.toUpperCase();
    const result = await vouchers.findAll({ where: { codeCategory: codeCategory, codeStatus: 'active' } });

    if (!result || result.length === 0) {
        return next(new AppError('No vouchers found with the specified category', 404));
    }

    return res.status(200).json({
        status: 'success',
        message: 'Vouchers fetched successfully',
        data: result.map(voucher => ({ codeName: voucher.codeName, 
            codePrice: voucher.codePrice, 
            bulkPurchasePrice: voucher.bulkPurchasePrice, 
            maxPurchaseQty: voucher.maxPurchaseQty, 
            minPurchaseLimit: voucher.minPurchaseLimit
         }))
    });
});


// Retrieve Voucher Codes
const retrieveVoucherCodes = catchAsync(async (req, res, next) => {
    const { transactionId, customerMobile, externalTransactionId, clientTransactionId, amount } = req.body;

    //save to logs
    saveLog('Retrieve Voucher Attempt', transactionId, 'attempt', `Request Body: ${JSON.stringify(req.body)}`);

    // Validate input

    if (!transactionId || transactionId.trim() === '') {
        return next(new AppError('transactionId is required', 400));
    }

    if (!customerMobile || customerMobile.trim() === '') {
        return next(new AppError('customerMobile is required', 400));
    }

    if (!externalTransactionId || externalTransactionId.trim() === '') {
        return next(new AppError('externalTransactionId is required', 400));
    }

    if (!clientTransactionId || clientTransactionId.trim() === '') {
        return next(new AppError('clientTransactionId is required', 400));
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return next(new AppError('Valid amount is required', 400));
    }

   try {

    // Check if the transaction has already been retrieved
    const existingRecord = await retrieveVouchers.findOne({ where: { transactionId  } });

    if (existingRecord) {
        saveLog('Retrieve Voucher Attempt', transactionId, 'failed', `transactionId ${transactionId} has already been processed`);
        return next(new AppError('This transaction has already been processed', 400));
    }

    // Find the transaction
    const transactionDetails = await transactions.findOne({ where: { transactionId: clientTransactionId } });

    if (!transactionDetails) {
        saveLog('Retrieve Voucher Attempt', transactionId, 'failed', `transactionId ${clientTransactionId} not found`);
        return next(new AppError('Transaction not found', 404));
    }

    const deliveredVouchers = await deliveredCodes.findAll({ where: { transactionId: transactionDetails.id } });

    if (!deliveredVouchers) {
        saveLog('Retrieve Voucher Attempt', transactionId, 'failed', `Delivered vouchers not found for transactionId ${transactionDetails.id}`);
        return next(new AppError('Delivered vouchers not found for this transaction', 404));
    }

    // Find the voucher template
    const voucherTemplate = await vouchers.findOne({
        where: { codeName: transactionDetails.paymentRef }
      });
    
    if (!voucherTemplate) {
        saveLog('Retrieve Voucher Attempt', transactionId, 'failed', `Voucher template not found for transactionId ${transactionId}`);
        return next(new AppError('Voucher template not found', 404));
    }

    // Send SMS (async, don’t block response)
    deliveredVouchers.forEach(delivered => {
       const message = `${voucherTemplate.codeMessage} - ${voucherTemplate.codeType1}: ${delivered.codeType1} ${voucherTemplate.codeType2}: ${delivered.codeType2} Link - ${voucherTemplate.codeLink}`;

        // Send SMS
        sendSms(transactionDetails.customerMobile, message)
          .then(() => saveLog('SMS sent', transactionId, 'success', message))
          .catch(err => saveLog('SMS failed:', transactionId, 'failed', `${err.message}`));

        // Send WhatsApp
        sendWhatsAppMsg(message, transactionDetails.customerMobile, transactionId)
          .then(() => saveLog('WhatsApp sent', transactionId, 'success', message))
          .catch(err => saveLog('WhatsApp failed:', transactionId, 'failed', `${err.message}`));

      });

    saveLog('Retrieve Voucher Attempt', transactionId, 'success', `Vouchers retrieved for transactionId ${transactionDetails.id}`);
 
    // Create record in retrievedCodes table
    await retrieveVouchers.create({
        transactionId,
        customerMobile,
        externalTransactionId,
        clientTransactionId,
        amount
    });


    return res.status(200).json({
        status: 'success',
        message: 'Voucher details retrieved successfully',
        // data: {
        //     transactionId: transactionDetails.id,
        //     deliveredVouchers
        // }
    });
    } catch (error) {
    saveLog('Retrieve Voucher Attempt', transactionId, 'failed', `Error retrieving vouchers: ${error.message}`);
    console.error('Error retrieving vouchers:', error);
    return next(new AppError('Error retrieving vouchers', 500));
    }
});

module.exports = { 
    createVoucher, 
    getAllVouchers, 
    getVoucherById, 
    updateVoucher, 
    deleteVoucher,
    getAllVoucherByCategory,
    retrieveVoucherCodes
};
