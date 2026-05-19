const { redisClient } = require("../congif/redisConnection");

const authRateLimiter = async (req, res, next) => {
    try {
        if (!redisClient.isReady) {
            return next(); // Fallback if Redis is down
        }

        // Use email if present (for signin/signup), otherwise fallback to IP
        const identifier = req.body.email ? req.body.email.toLowerCase() : (req.ip || req.connection.remoteAddress);
        const key = `rate_limit:auth:${identifier}`;

        const requests = await redisClient.incr(key);

        if (requests === 1) {
            // Set expiration on the first attempt
            await redisClient.expire(key, 900); // 15 minutes
        }

        if (requests > 5) {
            return res.status(429).json({
                success: false,
                message: "Too many attempts. Please try again after 15 minutes."
            });
        }

        next();
    } catch (error) {
        console.error("Rate Limiter Error:", error);
        next(); // Allow request to pass if Redis errors out
    }
};

module.exports = authRateLimiter;
