const jwt = require('jsonwebtoken');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization header' });
        }

        // For development/testing without Clerk
        if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
            return next();
        }

        // Extract the token
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // For development, you can verify the token with your JWT_SECRET
        // In production, this should use Clerk's verification
        if (process.env.NODE_ENV === 'development') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                return next();
            } catch (err) {
                console.error('Token verification failed:', err);
                return res.status(403).json({ message: 'Invalid token' });
            }
        } else {
            // In production, use Clerk's authentication
            return ClerkExpressRequireAuth()(req, res, next);
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Authentication error' });
    }
};

module.exports = authenticateJWT; 