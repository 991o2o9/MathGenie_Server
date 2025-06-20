// Контроллер для управления подразделами
// ...

import Subsection from '../models/subsection.model.js';
import Subject from '../models/subject.model.js';
import { formatDate } from '../utils/dateFormat.js';

// Создать подраздел
async function createSubsection(req, res) {
  const { name, subject } = req.body;
  if (!name || !subject)
    return res.status(400).json({ message: 'Название и subject обязательны' });
  // Найти максимальный id и увеличить на 1
  const last = await Subsection.findOne().sort({ id: -1 });
  const nextId = last && last.id ? last.id + 1 : 1;
  const subsection = await Subsection.create({ name, subject, id: nextId });
  res.status(201).json({
    id: subsection.id,
    _id: subsection._id,
    name: subsection.name,
    subject: subsection.subject,
    createdAt: formatDate(subsection.createdAt),
  });
}

// Получить все подразделы (по subject или все)
async function getSubsections(req, res) {
  if (req.query.subject) {
    const subject = await Subject.findById(req.query.subject);
    if (!subject) return res.status(404).json({ message: 'Subject не найден' });
    const subsections = await Subsection.find({ subject: subject._id });
    return res.json({
      _id: subject._id,
      id: subject.id,
      name: subject.name,
      createdAt: formatDate(subject.createdAt),
      subjection: subsections.map((s) => ({
        id: s.id,
        _id: s._id,
        name: s.name,
      })),
    });
  }
  // Старое поведение: вернуть все подразделы
  const subsections = await Subsection.find().populate('subject');
  const formatted = subsections.map((subsection) => ({
    id: subsection.id,
    _id: subsection._id,
    name: subsection.name,
    subject:
      subsection.subject && typeof subsection.subject === 'object'
        ? {
            _id: subsection.subject._id,
            id: subsection.subject.id,
            name: subsection.subject.name,
          }
        : subsection.subject,
    createdAt: formatDate(subsection.createdAt),
  }));
  res.json(formatted);
}

// Получить один подраздел
async function getSubsection(req, res) {
  const subsection = await Subsection.findById(req.params.id).populate(
    'subject'
  );
  if (!subsection) return res.status(404).json({ message: 'Не найдено' });
  res.json({
    id: subsection.id,
    _id: subsection._id,
    name: subsection.name,
    subject:
      subsection.subject && typeof subsection.subject === 'object'
        ? {
            _id: subsection.subject._id,
            id: subsection.subject.id,
            name: subsection.subject.name,
          }
        : subsection.subject,
    createdAt: formatDate(subsection.createdAt),
  });
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
