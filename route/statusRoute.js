const router = require('express').Router();
const { serverStatus} = require('../controller/statusController');

router.get('/', serverStatus);

module.exports = router;
