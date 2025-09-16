const router = require('express').Router();
const { get } = require('pm2');
const { basicAuth } = require('../controller/authController');
const voucherController = require('../controller/voucherController');
//const { createVoucher, getAllVouchers, getVoucherById, updateVoucher, deleteVoucher } = require('../controller/voucherController');


router.post('/', basicAuth, voucherController.createVoucher);
router.get('/', basicAuth, voucherController.getAllVouchers);
router.get('/:id', basicAuth, voucherController.getVoucherById);
router.get('/category/:category', basicAuth, voucherController.getAllVoucherByCategory);
router.post('/retrieve', voucherController.retrieveVoucherCodes);
router.patch('/:id', basicAuth, voucherController.updateVoucher);
router.delete('/:id', basicAuth, voucherController.deleteVoucher);


module.exports = router;
