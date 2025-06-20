// Контроллер для AI-вопросов
// ...

import AiQuestion from '../models/aiQuestion.model.js';
import { formatDate } from '../utils/dateFormat.js';
import { askHuggingFace } from '../utils/huggingface.js';

// GET /ai/top-questions
async function getTopQuestions(req, res) {
  const topQuestions = await AiQuestion.find().sort({ count: -1 }).limit(10);
  const formatted = topQuestions.map((q) => ({
    _id: q._id,
    question: q.question,
    answer: q.answer,
    user: q.user,
    count: q.count,
    createdAt: q.createdAt,
  }));
  res.json(formatted);
}

// POST /ai/ask
async function askAi(req, res) {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Вопрос обязателен' });
  // Получаем ответ от HuggingFace
  let answer;
  try {
    answer = await askHuggingFace(question);
  } catch (e) {
    return res
      .status(500)
      .json({ message: 'Ошибка HuggingFace', error: e.message });
  }
  // Сохраняем/обновляем вопрос в базе
  const userId = req.user?._id;
  const existing = await AiQuestion.findOne({ question });
  if (existing) {
    existing.count++;
    existing.answer = answer;
    await existing.save();
  } else {
    await AiQuestion.create({ question, user: userId, answer });
  }
  res.json({ question, answer });
}

// Получить все AI-вопросы (ADMIN)
async function getAllAiQuestions(req, res) {
  const questions = await AiQuestion.find().populate('user');
  const formatted = questions.map((q) => ({
    _id: q._id,
    question: q.question,
    answer: q.answer,
    user:
      q.user && typeof q.user === 'object'
        ? {
            _id: q.user._id,
            username: q.user.username,
            role: q.user.role,
          }
        : q.user,
    count: q.count,
    createdAt: formatDate(q.createdAt),
  }));
  res.json(formatted);
}

// Получить один AI-вопрос (ADMIN)
async function getAiQuestion(req, res) {
  const question = await AiQuestion.findById(req.params.id).populate('user');
  if (!question) return res.status(404).json({ message: 'Не найдено' });
  res.json({
    _id: question._id,
    question: question.question,
    answer: question.answer,
    user:
      question.user && typeof question.user === 'object'
        ? {
            _id: question.user._id,
            username: question.user.username,
            role: question.user.role,
          }
        : question.user,
    count: question.count,
    createdAt: formatDate(question.createdAt),
  });
}

// Удалить AI-вопрос (ADMIN)
async function deleteAiQuestion(req, res) {
  const question = await AiQuestion.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export {
  getTopQuestions,
  askAi,
  getAllAiQuestions,
  getAiQuestion,
  deleteAiQuestion,
};
