function validateBody(fields) {
    return (req, res, next) => {
        const missing = [];
        for (const field of fields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Validation failed. Missing required body fields: ${missing.join(', ')}`
            });
        }
        next();
    };
}

module.exports = { validateBody };
