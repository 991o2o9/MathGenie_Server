import express from 'express';
import {
  getTestHistories,
  getTestHistory,
  createTestHistory,
  deleteTestHistory,
} from '../controllers/testHistory.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TestHistory
 *   description: История прохождения тестов пользователя
 */

/**
 * @swagger
 * /test-history:
 *   get:
 *     summary: Получить всю свою историю тестов
 *     tags: [TestHistory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список записей истории
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /test-history/{id}:
 *   get:
 *     summary: Получить одну запись истории
 *     tags: [TestHistory]
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
 *         description: Данные записи истории
 *       404:
 *         description: Не найдено
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /test-history:
 *   post:
 *     summary: Создать запись истории (после прохождения теста)
 *     tags: [TestHistory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - resultPercent
 *               - correct
 *               - total
 *             properties:
 *               subject:
 *                 type: string
 *               level:
 *                 type: string
 *               resultPercent:
 *                 type: number
 *               correct:
 *                 type: integer
 *               total:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Запись истории создана
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /test-history/{id}:
 *   delete:
 *     summary: Удалить запись истории (только ADMIN)
 *     tags: [TestHistory]
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
 *         description: Запись удалена
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

// Получить всю историю пользователя
router.get('/', authMiddleware, getTestHistories);
// Получить одну запись истории
router.get('/:id', authMiddleware, getTestHistory);
// Создать запись истории (при прохождении теста)
router.post('/', authMiddleware, createTestHistory);
// Удалить запись (только ADMIN)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('ADMIN'),
  deleteTestHistory
);

export default router;
