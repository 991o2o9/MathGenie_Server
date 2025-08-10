import express from 'express';
import {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Управление предметами
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Получить все предметы
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список предметов
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: Получить один предмет
 *     tags: [Subjects]
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
 *         description: Данные предмета
 *       404:
 *         description: Не найдено
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Создать предмет
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               subtitle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Предмет создан
 *       409:
 *         description: Уже существует
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Обновить предмет
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subtitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Предмет обновлён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Удалить предмет
 *     tags: [Subjects]
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
 *         description: Предмет удалён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

// Получить все предметы
router.get('/', authMiddleware, getSubjects);
// Получить один предмет
router.get('/:id', authMiddleware, getSubject);
// Создать предмет (ADMIN)
router.post('/', authMiddleware, isAdmin, createSubject);
// Обновить предмет (ADMIN)
router.put('/:id', authMiddleware, isAdmin, updateSubject);
// Удалить предмет (ADMIN)
router.delete('/:id', authMiddleware, isAdmin, deleteSubject);

export default router;
