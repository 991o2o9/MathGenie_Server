// Контроллер для управления темами
// ...

import Topic from '../models/topic.model.js';
import { askHuggingFace } from '../utils/huggingface.js';
import { formatDate } from '../utils/dateFormat.js';

// Создать тему
async function createTopic(req, res) {
  const { name, explanation, subsection } = req.body;
  if (!name || !subsection)
    return res
      .status(400)
      .json({ message: 'Название и subsection обязательны' });

  // Явно приводим explanation к строке, если не пришло — делаем пустую строку
  let finalExplanation = typeof explanation === 'string' ? explanation : '';
  if (!finalExplanation.trim()) {
    // Генерируем explanation через ИИ
    const prompt = `Объясни тему по школьному предмету: "${name}". Дай подробное объяснение с примерами и практическими применениями.`;
    try {
      finalExplanation = await askHuggingFace(prompt);
      console.log('AI explanation:', finalExplanation);
    } catch (e) {
      console.error('Ошибка HuggingFace:', e);
      return res
        .status(500)
        .json({ message: 'Ошибка генерации explanation', error: e.message });
    }
  }
  console.log('explanation из req.body:', explanation);
  console.log('finalExplanation:', finalExplanation);

  // Найти максимальный id и увеличить на 1
  const last = await Topic.findOne().sort({ id: -1 });
  const nextId = last && last.id ? last.id + 1 : 1;

  // Логируем перед созданием темы
  console.log('Создаём тему:', {
    name,
    explanation: finalExplanation,
    subsection,
    id: nextId,
  });

  const topic = await Topic.create({
    id: nextId,
    name,
    explanation: finalExplanation,
    subsection,
  });
  res.status(201).json({
    _id: topic._id,
    id: topic.id,
    name: topic.name,
    explanation: topic.explanation,
    subsection: topic.subsection,
    createdAt: formatDate(topic.createdAt),
  });
}

// Получить все темы (по subsection или все)
async function getTopics(req, res) {
  const filter = req.query.subsection
    ? { subsection: req.query.subsection }
    : {};
  const topics = await Topic.find(filter).populate('subsection');
  const formatted = topics.map((topic) => ({
    _id: topic._id,
    name: topic.name,
    explanation: topic.explanation,
    createdAt: formatDate(topic.createdAt),
  }));
  res.json(formatted);
}

// Получить одну тему
async function getTopic(req, res) {
  const topic = await Topic.findById(req.params.id).populate('subsection');
  if (!topic) return res.status(404).json({ message: 'Не найдено' });
  res.json({
    _id: topic._id,
    name: topic.name,
    explanation: topic.explanation,
    createdAt: formatDate(topic.createdAt),
  });
}

// Обновить тему
async function updateTopic(req, res) {
  const { name, explanation, subsection } = req.body;
  const topic = await Topic.findByIdAndUpdate(
    req.params.id,
    { name, explanation, subsection },
    { new: true }
  );
  if (!topic) return res.status(404).json({ message: 'Не найдено' });
  res.json(topic);
}

// Удалить тему
async function deleteTopic(req, res) {
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export { createTopic, getTopics, getTopic, updateTopic, deleteTopic };
