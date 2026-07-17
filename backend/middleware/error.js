function errorHandler(err, req, res, next) {
    console.error('❌ [Centralized Error Handler]:', err.stack || err.message);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        statusCode
    });
}

module.exports = { errorHandler };
