require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const serverConfig = require('./config/config.json').servers;
const app = express();
const cors = require('cors');
const voucherRoute = require('./route/voucherRoute');
const paymentRoute = require('./route/paymentRoute');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const statusRoute = require('./route/statusRoute');
const paymentTestRoute = require('./route/paymentTestRoute');



// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/v1/voucher', voucherRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/payment-test', paymentTestRoute);
app.use('/api/v1/status', statusRoute);



// 404 handler for undefined routes
app.use('', catchAsync(async (req, res, next) => {
    throw new AppError('This route is not defined', 404);
}));

app.use(globalErrorHandler);

const PORT = process.env.APP_PORT || 8000;


// Start server on multiple ports
// serverConfig.forEach(({ host, port }) => {
//     console.log(`Server is running on http://${host}:${port}`);
//     app.listen(port, host);
// });


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

