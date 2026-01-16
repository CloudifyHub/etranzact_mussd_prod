const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * PAYMENT / FINANCIAL ENDPOINTS
 * Very strict
 */
exports.paymentLimiter = [
  slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 1,
    delayMs: () => 2000,
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many payment requests. Please try again later.',
  }),
];



/**
 * TEST / LOAD / INTERNAL ENDPOINTS
 */
exports.testLimiter = [
  slowDown({
    windowMs: 5 * 60 * 1000,
    delayAfter: 5,
    delayMs: () => 1000,
  }),
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: 'Too many test requests.',
  }),
];


/**
 * PUBLIC / LOW-RISK ENDPOINTS
 */
exports.publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});



/**
 * PUBLIC / PAYMENT ENDPOINTS
 */
exports.waecPublicLimiter = [
  slowDown({
    windowMs: 60 * 1000,     // 1 minute
    delayAfter: 50,          // was 30 → now allow more burst
    delayMs: () => 150,      // was 200ms → gentler slowdown
  }),
  rateLimit({
    windowMs: 60 * 1000,
    max: 180,                // was 120 → now 3 req/sec
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Please wait a moment before trying again.',
  }),
];






