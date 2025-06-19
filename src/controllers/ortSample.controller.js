// Контроллер для управления пробниками (OrtSample)
// ...

const OrtSample = require('../models/ortSample.model');
const path = require('path');

// Создать пробник (текст или файл)
async function createOrtSample(req, res) {
  const { content, topic } = req.body;
  let file = null;
  if (req.file) {
    file = req.file.filename;
  }
  if (!content && !file)
    return res.status(400).json({ message: 'content или файл обязателен' });
  if (!topic) return res.status(400).json({ message: 'topic обязателен' });
  const ortSample = await OrtSample.create({ content, file, topic });
  res.status(201).json(ortSample);
}

// Получить все пробники (по topic или все)
async function getOrtSamples(req, res) {
  const filter = req.query.topic ? { topic: req.query.topic } : {};
  const ortSamples = await OrtSample.find(filter).populate('topic');
  res.json(ortSamples);
}

// Получить один пробник
async function getOrtSample(req, res) {
  const ortSample = await OrtSample.findById(req.params.id).populate('topic');
  if (!ortSample) return res.status(404).json({ message: 'Не найдено' });
  res.json(ortSample);
}

// Обновить пробник
async function updateOrtSample(req, res) {
  const { content, topic } = req.body;
  let file = undefined;
  if (req.file) {
    file = req.file.filename;
  }
  const update = { content, topic };
  if (file) update.file = file;
  const ortSample = await OrtSample.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });
  if (!ortSample) return res.status(404).json({ message: 'Не найдено' });
  res.json(ortSample);
}

// Удалить пробник
async function deleteOrtSample(req, res) {
  const ortSample = await OrtSample.findByIdAndDelete(req.params.id);
  if (!ortSample) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

module.exports = {
  createOrtSample,
  getOrtSamples,
  getOrtSample,
  updateOrtSample,
  deleteOrtSample,
};
