// Контроллер для управления предметами
// ...

import Subject from '../models/subject.model.js';

// Создать предмет
async function createSubject(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Название обязательно' });
  const exists = await Subject.findOne({ name });
  if (exists)
    return res.status(409).json({ message: 'Такой предмет уже есть' });
  const subject = await Subject.create({ name });
  res.status(201).json(subject);
}

// Получить все предметы
async function getSubjects(req, res) {
  const subjects = await Subject.find();
  res.json(subjects);
}

// Получить один предмет
async function getSubject(req, res) {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Не найдено' });
  res.json(subject);
}

// Обновить предмет
async function updateSubject(req, res) {
  const { name } = req.body;
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { name },
    { new: true }
  );
  if (!subject) return res.status(404).json({ message: 'Не найдено' });
  res.json(subject);
}

// Удалить предмет
async function deleteSubject(req, res) {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Не найдено' });
  res.json({ message: 'Удалено' });
}

export { createSubject, getSubjects, getSubject, updateSubject, deleteSubject };
