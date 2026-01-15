const router = require('express').Router();
const { get } = require('pm2');
const { basicAuth } = require('../controller/authController');
const processPaymentTest = require('../controller/paymentControllerTest');


router.post('/', basicAuth, processPaymentTest.processPaymentTest);
// router.post('/', processPaymentTest.processPaymentTest);
module.exports = router;
