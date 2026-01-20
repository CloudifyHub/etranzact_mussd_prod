const router = require('express').Router();
const { get } = require('pm2');
const { basicAuth } = require('../controller/authController');
const voucherController = require('../controller/voucherController');
//const { createVoucher, getAllVouchers, getVoucherById, updateVoucher, deleteVoucher } = require('../controller/voucherController');


router.post('/', basicAuth, voucherController.createVoucher);
router.get('/', basicAuth, voucherController.getAllVouchers);
router.get('/:id', basicAuth, voucherController.getVoucherById);
router.get('/category/:category', basicAuth, voucherController.getAllVoucherByCategory);
router.post('/retrieve', basicAuth, voucherController.retrieveVoucherCodes);
router.post('/retrieve-voucher', basicAuth, voucherController.retrievePurchasedVoucherCodes);
router.patch('/:id', basicAuth, voucherController.updateVoucher);
router.delete('/:id', basicAuth, voucherController.deleteVoucher);


module.exports = router;
