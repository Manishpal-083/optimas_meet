const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'optimas_meet_super_secret_fallback_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
};
