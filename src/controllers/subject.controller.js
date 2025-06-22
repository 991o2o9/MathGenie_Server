// Контроллер для управления предметами
// ...

import Subject from '../models/subject.model.js';
import { formatDate } from '../utils/dateFormat.js';

// Создать предмет
async function createSubject(req, res) {
  const { name, subtitle } = req.body;
  if (!name) return res.status(400).json({ message: 'Название обязательно' });
  const exists = await Subject.findOne({ name });
  if (exists)
    return res.status(409).json({ message: 'Такой предмет уже есть' });
  // Найти максимальный id и увеличить на 1
  const last = await Subject.findOne().sort({ id: -1 });
  const nextId = last && last.id ? last.id + 1 : 1;
  const subject = await Subject.create({ name, subtitle, id: nextId });
  const formattedSubject = {
    id: subject.id,
    _id: subject._id,
    name: subject.name,
    subtitle: subject.subtitle,
    createdAt: formatDate(subject.createdAt),
  };
  res.status(201).json(formattedSubject);
}

// Получить все предметы
async function getSubjects(req, res) {
  const subjects = await Subject.find();
  const formattedSubjects = subjects.map((subject) => ({
    id: subject.id,
    _id: subject._id,
    name: subject.name,
    subtitle: subject.subtitle,
    createdAt: formatDate(subject.createdAt),
  }));
  res.json(formattedSubjects);
}

// Получить один предмет
async function getSubject(req, res) {
  // Поиск по id (числовому)
  const subject = await Subject.findOne({ id: Number(req.params.id) });
  if (!subject) return res.status(404).json({ message: 'Не найдено' });
  const formattedSubject = {
    id: subject.id,
    _id: subject._id,
    name: subject.name,
    subtitle: subject.subtitle,
    createdAt: formatDate(subject.createdAt),
  };
  res.json(formattedSubject);
}

// Обновить предмет
async function updateSubject(req, res) {
  const { name, subtitle } = req.body;
  // Поиск и обновление по числовому id
  const subject = await Subject.findOneAndUpdate(
    { id: Number(req.params.id) },
    { name, subtitle },
    { new: true }
  );
  if (!subject) return res.status(404).json({ message: 'Не найдено' });
  const formattedSubject = {
    id: subject.id,
    _id: subject._id,
    name: subject.name,
    subtitle: subject.subtitle,
    createdAt: formatDate(subject.createdAt),
  };
  res.json(formattedSubject);
}

// Удалить предмет
async function deleteSubject(req, res) {
  // Поиск и удаление по числовому id
  const subject = await Subject.findOneAndDelete({ id: Number(req.params.id) });
  if (!subject) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export { createSubject, getSubjects, getSubject, updateSubject, deleteSubject };
