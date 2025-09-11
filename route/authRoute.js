const router = require('express').Router();
const { signup, login, basicAuth } = require('../controller/authController');

router.post('/signup', basicAuth, signup);
router.post('/login', basicAuth, login);

module.exports = router;
