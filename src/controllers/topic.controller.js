// Контроллер для управления темами
// ...

const Topic = require('../models/topic.model');

// Создать тему
async function createTopic(req, res) {
  const { name, explanation, subsection } = req.body;
  if (!name || !subsection)
    return res
      .status(400)
      .json({ message: 'Название и subsection обязательны' });
  const topic = await Topic.create({ name, explanation, subsection });
  res.status(201).json(topic);
}

// Получить все темы (по subsection или все)
async function getTopics(req, res) {
  const filter = req.query.subsection
    ? { subsection: req.query.subsection }
    : {};
  const topics = await Topic.find(filter).populate('subsection');
  res.json(topics);
}

// Получить одну тему
async function getTopic(req, res) {
  const topic = await Topic.findById(req.params.id).populate('subsection');
  if (!topic) return res.status(404).json({ message: 'Не найдено' });
  res.json(topic);
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

module.exports = {
  createTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,
};
