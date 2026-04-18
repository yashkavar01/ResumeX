const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ detail: 'Unauthorized' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ detail: 'Access denied. Admin privileges required.' });
    }

    next();
};

module.exports = adminMiddleware;
