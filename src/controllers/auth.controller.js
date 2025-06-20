// Контроллер для аутентификации
// ...

import User from '../models/user.model.js';
import { comparePassword } from '../utils/bcrypt.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

// POST /auth/login
async function login(req, res) {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const access = generateAccessToken({ id: user._id, role: user.role });
  const refresh = generateRefreshToken({ id: user._id, role: user.role });
  res.json({
    access,
    refresh,
    user: { id: user._id, username: user.username, role: user.role },
  });
}

// POST /auth/refresh
async function refreshTokenController(req, res) {
  const { refresh } = req.body;
  if (!refresh)
    return res.status(400).json({ message: 'No refresh token provided' });
  try {
    const decoded = verifyRefreshToken(refresh);
    const access = generateAccessToken({ id: decoded.id, role: decoded.role });
    res.json({ access });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export { login, refreshTokenController };
