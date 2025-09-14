'use strict';

const vouchers = require('../db/models/voucherCodes');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


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



const getAllVoucherByCategory = catchAsync(async (req, res, next) => {
    const codeCategory = req.params.category.toUpperCase();
    const result = await vouchers.findAll({ where: { codeCategory: codeCategory } });

    if (!result || result.length === 0) {
        return next(new AppError('No vouchers found with the specified category', 404));
    }

    return res.status(200).json({
        status: 'success',
        message: 'Vouchers fetched successfully',
        data: result
    });
});

module.exports = { 
    createVoucher, 
    getAllVouchers, 
    getVoucherById, 
    updateVoucher, 
    deleteVoucher,
    getAllVoucherByCategory
};
