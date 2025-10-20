const catchAsync = require('../utils/catchAsync');

const serverStatus = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

module.exports = {
  serverStatus
};