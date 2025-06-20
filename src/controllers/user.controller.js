// Контроллер для управления пользователями
// ...

import User from '../models/user.model.js';
import { hashPassword } from '../utils/bcrypt.js';
import { formatDate } from '../utils/dateFormat.js';

// Создать пользователя (ADMIN)
async function createUser(req, res) {
  const { username, password, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'username и password обязательны' });
  const exists = await User.findOne({ username });
  if (exists)
    return res.status(409).json({ message: 'Пользователь уже существует' });
  const hashed = await hashPassword(password);
  const user = await User.create({ username, password: hashed, role });
  res.status(201).json({
    _id: user._id,
    username: user.username,
    role: user.role,
    createdAt: formatDate(user.createdAt),
  });
}

// Получить всех пользователей (ADMIN)
async function getUsers(req, res) {
  const users = await User.find().select('-password');
  const formatted = users.map((user) => ({
    _id: user._id,
    username: user.username,
    role: user.role,
    createdAt: formatDate(user.createdAt),
  }));
  res.json(formatted);
}

// Получить одного пользователя (ADMIN)
async function getUser(req, res) {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'Не найдено' });
  res.json({
    _id: user._id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  });
}

// Обновить пользователя (ADMIN)
async function updateUser(req, res) {
  const { username, password, role } = req.body;
  const update = { username, role };
  if (password) update.password = await hashPassword(password);
  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
  }).select('-password');
  if (!user) return res.status(404).json({ message: 'Не найдено' });
  res.json({
    _id: user._id,
    username: user.username,
    role: user.role,
    createdAt: formatDate(user.createdAt),
  });
}

// Удалить пользователя (ADMIN)
async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export { createUser, getUsers, getUser, updateUser, deleteUser };
