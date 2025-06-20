// Контроллер для управления темами
// ...

import { askHuggingFace } from '../utils/huggingface.js';
import { formatDate } from '../utils/dateFormat.js';
import Subsection from '../models/subsection.model.js';
import Subject from '../models/subject.model.js';
import Topic from '../models/topic.model.js';

// Создать тему
async function createTopic(req, res) {
  const { name, subtitle, explanation, subsection } = req.body;
  if (!name || !subsection)
    return res
      .status(400)
      .json({ message: 'Название и subsection обязательны' });

  let finalExplanation = typeof explanation === 'string' ? explanation : '';

  let subjectName = '';
  let subsectionName = '';
  try {
    const subsectionDoc = await Subsection.findById(subsection).populate(
      'subject'
    );
    if (subsectionDoc) {
      subsectionName = subsectionDoc.name;
      if (subsectionDoc.subject && subsectionDoc.subject.name) {
        subjectName = subsectionDoc.subject.name;
      } else if (subsectionDoc.subject) {
        // Если subject не популярен, получить его отдельно
        const subjectDoc = await Subject.findById(subsectionDoc.subject);
        if (subjectDoc) subjectName = subjectDoc.name;
      }
    }
  } catch (e) {
    console.log('Ошибка получения subject/subsection:', e);
  }

  if (!finalExplanation.trim()) {
    const prompt = `Внимание: отвечай только на русском языке. Не используй английский или китайский язык.
Ты — опытный преподаватель, готовящий учеников к ОРТ (Общее Республиканское Тестирование) в Кыргызстане.
Тебе нужно объяснить тему "${name}" из раздела "${subsectionName}" по предмету "${subjectName}" для 10–11 класса.
Объяснение должно быть полностью на русском языке.

Требования:
- Дай чёткое и краткое определение.
- Приведи минимум 1 пример, как это может встретиться в тесте ОРТ.
- Объяснение должно быть понятно ученику, готовящемуся к экзамену.
- Избегай лишней теории. Только то, что может реально пригодиться на тесте.

Формат:
1. Определение:
2. Пример задачи:
3. Подсказка/совет:

Ответь только на русском языке.`;
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

  const last = await Topic.findOne().sort({ id: -1 });
  const nextId = last && last.id ? last.id + 1 : 1;

  console.log('Создаём тему:', {
    name,
    subtitle,
    explanation: finalExplanation,
    subsection,
    id: nextId,
  });

  const topic = await Topic.create({
    id: nextId,
    name,
    subtitle,
    explanation: finalExplanation,
    subsection,
  });

  res.status(201).json({
    _id: topic._id,
    id: topic.id,
    name: topic.name,
    subtitle: topic.subtitle,
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
    id: topic.id,
    name: topic.name,
    subtitle: topic.subtitle,
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
    id: topic.id,
    name: topic.name,
    subtitle: topic.subtitle,
    explanation: topic.explanation,
    createdAt: formatDate(topic.createdAt),
  });
}

// Обновить тему
async function updateTopic(req, res) {
  const { name, subtitle, explanation, subsection } = req.body;
  const topic = await Topic.findByIdAndUpdate(
    req.params.id,
    { name, subtitle, explanation, subsection },
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
