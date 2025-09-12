'use strict';
require('dotenv').config({ path: `${process.cwd()}/.env` });
const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


// Send SMS using Arkesel API
const sendSms = async (recipient, message, options = {}) => {
  try {
    const payload = {
      sender: process.env.ARKSEL_SMS_SENDER_ID || 'MAWULEPE',
      message,
      recipients: Array.isArray(recipient) ? recipient : [recipient],
      ...options // e.g. { scheduled_date, callback_url, use_case }
    };

    const config = {
      method: 'post',
      url: process.env.ARKSEL_SMS_URL || 'https://sms.arkesel.com/api/v2/sms/send',
      headers: {
        'api-key': process.env.ARKSEL_SMS_API_KEY
      },
      data: payload
    };

    const response = await axios(config);
    console.log(`SMS sent to ${recipient}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to send SMS to ${recipient}:`, error.response?.data || error.message);
    throw error;
  }
};

// ✅ Send Scheduled SMS
const scheduleSms = async (recipient, message, scheduledDate, options = {}) => {
  return sendSms(recipient, message, { ...options, scheduled_date: scheduledDate });
};

// ✅ Send SMS with Delivery Webhook
const sendSmsWithWebhook = async (recipient, message, callbackUrl, options = {}) => {
  return sendSms(recipient, message, { ...options, callback_url: callbackUrl });
};

module.exports = {
  sendSms,
  scheduleSms,
  sendSmsWithWebhook
};
