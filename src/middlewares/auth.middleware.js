import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function authMiddleware(req, res, next) {
  console.log('Auth middleware called for:', req.method, req.path);

  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'present' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token found in header');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      console.log('Invalid token payload');
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    console.log('Token verified, finding user:', decoded.id);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('User found:', user.username);
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res
      .status(500)
      .json({ message: 'Authentication error', error: err.message });
  }
}

export default authMiddleware;
