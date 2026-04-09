const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please log in again.' });
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
    const admin = await Admin.findById(decoded.id).select('-passwordHash');
    if (!admin)         return res.status(401).json({ error: 'Admin account not found.' });
    if (!admin.isActive) return res.status(403).json({ error: 'Account deactivated.' });
    req.admin = admin;
    next();
  } catch (err) {
    console.error('[authMiddleware]', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authenticated.' });
    if (!roles.includes(req.admin.role)) return res.status(403).json({ error: `Required role: ${roles.join(' or ')}.` });
    next();
}
}

module.exports = { protect, requireRole };
