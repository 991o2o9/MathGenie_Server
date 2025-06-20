// Контроллер для истории прохождения тестов
// ...

import TestHistory from '../models/testHistory.model.js';
import { formatDate } from '../utils/dateFormat.js';

// Получить всю историю пользователя
async function getTestHistories(req, res) {
  const histories = await TestHistory.find({ user: req.user._id }).populate(
    'subject'
  );
  const formatted = histories.map((history) => ({
    subject:
      history.subject && typeof history.subject === 'object'
        ? {
            id: history.subject.id,
            name: history.subject.name,
          }
        : history.subject,
    date: formatDate(history.date),
    level: history.level,
    resultPercent: history.resultPercent,
    correct: history.correct,
    total: history.total,
  }));
  res.json(formatted);
}

// Получить одну запись истории
async function getTestHistory(req, res) {
  const history = await TestHistory.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate('subject');
  if (!history) return res.status(404).json({ message: 'Не найдено' });
  res.json({
    subject:
      history.subject && typeof history.subject === 'object'
        ? {
            id: history.subject.id,
            name: history.subject.name,
          }
        : history.subject,
    date: formatDate(history.date),
    level: history.level,
    resultPercent: history.resultPercent,
    correct: history.correct,
    total: history.total,
  });
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
  res.status(201).json({
    _id: history._id,
    subject: history.subject,
    date: history.date,
    level: history.level,
    resultPercent: history.resultPercent,
    correct: history.correct,
    total: history.total,
  });
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
