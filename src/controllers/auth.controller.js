// Контроллер для аутентификации
// ...

import User from '../models/user.model.js';
import { comparePassword } from '../utils/bcrypt.js';
import { generateToken } from '../utils/jwt.js';

// POST /auth/login
async function login(req, res) {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const token = generateToken({ id: user._id, role: user.role });
  res.json({
    token,
    user: { id: user._id, username: user.username, role: user.role },
  });
}

export { login };
