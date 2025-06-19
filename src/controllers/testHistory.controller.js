// Контроллер для истории прохождения тестов
// ...

import TestHistory from '../models/testHistory.model.js';

// Получить всю историю пользователя
async function getTestHistories(req, res) {
  const histories = await TestHistory.find({ user: req.user._id }).populate(
    'subject'
  );
  res.json(histories);
}

// Получить одну запись истории
async function getTestHistory(req, res) {
  const history = await TestHistory.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('subject');
  if (!history) return res.status(404).json({ message: 'Не найдено' });
  res.json(history);
}

// Создать запись истории (используется при прохождении теста)
async function createTestHistory(req, res) {
  const { subject, level, resultPercent, correct, total } = req.body;
  if (!subject || resultPercent == null || correct == null || total == null)
    return res.status(400).json({ message: 'Необходимы все поля' });
  const history = await TestHistory.create({
    user: req.user._id,
    subject,
    level,
    resultPercent,
    correct,
    total,
  });
  res.status(201).json(history);
}

// Удалить запись (только ADMIN)
async function deleteTestHistory(req, res) {
  const history = await TestHistory.findByIdAndDelete(req.params.id);
  if (!history) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export {
  getTestHistories,
  getTestHistory,
  createTestHistory,
  deleteTestHistory,
};
