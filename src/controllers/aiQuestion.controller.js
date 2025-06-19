// Контроллер для AI-вопросов
// ...

const AiQuestion = require('../models/aiQuestion.model');
const { askHuggingFace } = require('../utils/huggingface');

// GET /ai/top-questions
async function getTopQuestions(req, res) {
  const topQuestions = await AiQuestion.find().sort({ count: -1 }).limit(10);
  res.json(topQuestions);
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
    await existing.save();
  } else {
    await AiQuestion.create({ question, user: userId });
  }
  res.json({ question, answer });
}

// Получить все AI-вопросы (ADMIN)
async function getAllAiQuestions(req, res) {
  const questions = await AiQuestion.find().populate('user');
  res.json(questions);
}

// Получить один AI-вопрос (ADMIN)
async function getAiQuestion(req, res) {
  const question = await AiQuestion.findById(req.params.id).populate('user');
  if (!question) return res.status(404).json({ message: 'Не найдено' });
  res.json(question);
}

// Удалить AI-вопрос (ADMIN)
async function deleteAiQuestion(req, res) {
  const question = await AiQuestion.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

module.exports = {
  getTopQuestions,
  askAi,
  getAllAiQuestions,
  getAiQuestion,
  deleteAiQuestion,
};
