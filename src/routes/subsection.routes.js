const express = require('express');
const router = express.Router();
const {
  createSubsection,
  getSubsections,
  getSubsection,
  updateSubsection,
  deleteSubsection,
} = require('../controllers/subsection.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Subsections
 *   description: Управление подразделами
 */

/**
 * @swagger
 * /subsections:
 *   get:
 *     summary: Получить все подразделы
 *     tags: [Subsections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: ID предмета для фильтрации
 *     responses:
 *       200:
 *         description: Список подразделов
 *       401:
 *         description: Нет или неверный токен
 */

// Получить все подразделы (можно фильтровать по subject)
router.get('/', authMiddleware, getSubsections);
// Получить один подраздел
router.get('/:id', authMiddleware, getSubsection);
// Создать подраздел (ADMIN)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createSubsection);
// Обновить подраздел (ADMIN)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateSubsection);
// Удалить подраздел (ADMIN)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('ADMIN'),
  deleteSubsection
);

/**
 * @swagger
 * /subsections/{id}:
 *   delete:
 *     summary: Удалить подраздел
 *     tags: [Subsections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Подраздел удалён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

module.exports = router;
