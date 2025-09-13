'use strict';
require('dotenv').config({ path: `${process.cwd()}/.env` });
const axios = require('axios');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');


/**
 * Send a WhatsApp message using Green API
 * @param {string} message - The message content
 * @param {string} phone - The phone number (format: 233546640723)
 * @param {string} transactionId - Transaction reference (for logging)
 * @returns {object} - Response from Green API
 */

async function sendWhatsAppMsg(message, phone, transactionId) {
  const url = `${process.env.WHATSAPP_API_URL}`;

  try {
    const body = {
      chatId: `${phone}@c.us`,
      message: message,
    };

    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
    });

    console.log(
      `WhatsApp message sent [${transactionId}] → ${phone}`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`WhatsApp send failed [${transactionId}] → ${phone}`, error.message);
    throw error;
  }
}

module.exports = { sendWhatsAppMsg };
