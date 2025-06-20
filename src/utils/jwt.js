// Утилита для генерации и проверки JWT
// ...

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateAccessToken(payload) {
  return jwt.sign({ ...payload, token_type: 'access' }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

function generateRefreshToken(payload) {
  return jwt.sign({ ...payload, token_type: 'refresh' }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.token_type !== 'access') throw new Error('Not an access token');
  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.token_type !== 'refresh') throw new Error('Not a refresh token');
  return decoded;
}

export {
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
