
const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {

    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.message || 'Internal server error';
    const stack = err.stack || '';

    res.status(statusCode).json({
        status: 'failure',
        message,
        stack
    });
}


const sendErrorProd = (err, res) => {

    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.message || 'Internal server error';
    const stack = err.stack || '';

    if (err.isOperational) {
        return res.status(statusCode).json({
            status: 'failure',
            message
        });
    } else {
       return res.status(statusCode).json({
            status : 'failure',
            message : 'Something went very wrong!'
        });
    }
}


const globalErrorHandler = (err, req, res, next) => {
    console.log(err);
    console.log(process.env.NODE_ENV);

    if (err.name === 'JsonWebTokenError') {
        err = new AppError('Invalid token, please login again', 401);
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        err = new AppError(err.errors[0].message, 400);
    }

    if(err.name === 'SequelizeValidationError'){
        err = new AppError(err.errors[0].message, 400);
    }


    if(process.env.NODE_ENV === 'development'){
        return sendErrorDev(err, res);
    }

    sendErrorProd(err, res);

}

module.exports = globalErrorHandler;