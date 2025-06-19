// Контроллер для управления подразделами
// ...

import Subsection from '../models/subsection.model.js';

// Создать подраздел
async function createSubsection(req, res) {
  const { name, subject } = req.body;
  if (!name || !subject)
    return res.status(400).json({ message: 'Название и subject обязательны' });
  const subsection = await Subsection.create({ name, subject });
  res.status(201).json(subsection);
}

// Получить все подразделы (по subject или все)
async function getSubsections(req, res) {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const subsections = await Subsection.find(filter).populate('subject');
  res.json(subsections);
}

// Получить один подраздел
async function getSubsection(req, res) {
  const subsection = await Subsection.findById(req.params.id).populate(
    'subject'
  );
  if (!subsection) return res.status(404).json({ message: 'Не найдено' });
  res.json(subsection);
}

// Обновить подраздел
async function updateSubsection(req, res) {
  const { name, subject } = req.body;
  const subsection = await Subsection.findByIdAndUpdate(
    req.params.id,
    { name, subject },
    { new: true }
  );
  if (!subsection) return res.status(404).json({ message: 'Не найдено' });
  res.json(subsection);
}

// Удалить подраздел
async function deleteSubsection(req, res) {
  const subsection = await Subsection.findByIdAndDelete(req.params.id);
  if (!subsection) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export {
  createSubsection,
  getSubsections,
  getSubsection,
  updateSubsection,
  deleteSubsection,
};
