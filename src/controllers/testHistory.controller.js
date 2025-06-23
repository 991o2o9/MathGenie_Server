// Контроллер для истории прохождения тестов
// ...

import TestHistory from '../models/testHistory.model.js';
import { formatDate } from '../utils/dateFormat.js';

// Получить всю историю пользователя (с полной детализацией)
async function getTestHistories(req, res) {
  try {
    const histories = await TestHistory.find({ user: req.user._id })
      .populate('subject', 'name') // Загружаем только имя предмета
      .sort({ date: -1 });

    const formatted = histories.map((history) => ({
      id: history._id,
      testId: history.test,
      subject: history.subject ? { name: history.subject.name } : null,
      date: formatDate(history.date),
      level: history.level,
      resultPercent: history.resultPercent,
      correct: history.correct,
      total: history.total,
      durationSeconds: history.durationSeconds,
      answers: history.answers.map(
        ({ questionId, correctOptionId, selectedOptionId, explanation }) => ({
          questionId,
          correctOptionId,
          selectedOptionId,
          explanation,
        })
      ),
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения истории', error });
  }
}

// Получить одну запись истории (детально)
async function getTestHistory(req, res) {
  try {
    console.log('getTestHistory called with ID:', req.params.id);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    console.log('User ID:', req.user._id);

    const history = await TestHistory.findById(req.params.id).populate(
      'subject',
      'name'
    );

    console.log('Found history:', history ? 'yes' : 'no');
    if (history) {
      console.log('History user ID:', history.user.toString());
      console.log('Current user ID:', req.user._id.toString());
    }

    if (!history) {
      return res.status(404).json({ message: 'Запись истории не найдена' });
    }

    // Проверяем, что запись принадлежит текущему пользователю
    if (history.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    res.json({
      id: history._id,
      testId: history.test,
      subject: history.subject ? { name: history.subject.name } : null,
      date: formatDate(history.date),
      level: history.level,
      resultPercent: history.resultPercent,
      correct: history.correct,
      total: history.total,
      durationSeconds: history.durationSeconds,
      answers: history.answers.map(
        ({ questionId, correctOptionId, selectedOptionId, explanation }) => ({
          questionId,
          correctOptionId,
          selectedOptionId,
          explanation,
        })
      ),
    });
  } catch (error) {
    console.error('Ошибка получения записи истории:', error);
    res.status(500).json({ message: 'Ошибка получения записи истории', error });
  }
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
