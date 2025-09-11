const router = require('express').Router();
const { get } = require('pm2');
const { basicAuth } = require('../controller/authController');
const paymentController = require('../controller/paymentController');


router.post('/', basicAuth, paymentController.processPayment);

module.exports = router;
