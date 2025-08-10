// Роуты для AI-вопросов
// ...

import express from 'express';
import {
  getTopQuestions,
  askAi,
  getAllAiQuestions,
  getAiQuestion,
  deleteAiQuestion,
} from '../controllers/aiQuestion.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AiQuestions
 *   description: Вопросы к ИИ (AI)
 */

/**
 * @swagger
 * /ai/top-questions:
 *   get:
 *     summary: Получить топ популярных AI-вопросов
 *     tags: [AiQuestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список топовых вопросов
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /ai/ask:
 *   post:
 *     summary: Задать вопрос ИИ и получить ответ
 *     tags: [AiQuestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ответ от ИИ
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /ai:
 *   get:
 *     summary: Получить все AI-вопросы (только ADMIN)
 *     tags: [AiQuestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список AI-вопросов
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /ai/{id}:
 *   get:
 *     summary: Получить один AI-вопрос (только ADMIN)
 *     tags: [AiQuestions]
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
 *         description: Данные AI-вопроса
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /ai/{id}:
 *   delete:
 *     summary: Удалить AI-вопрос (только ADMIN)
 *     tags: [AiQuestions]
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
 *         description: Вопрос удалён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

router.get('/top-questions', authMiddleware, getTopQuestions);
router.post('/ask', authMiddleware, askAi);

// Получить все AI-вопросы (ADMIN)
router.get('/', authMiddleware, isAdmin, getAllAiQuestions);
// Получить один AI-вопрос (ADMIN)
router.get('/:id', authMiddleware, isAdmin, getAiQuestion);
// Удалить AI-вопрос (ADMIN)
router.delete(
  '/:id',
  authMiddleware,
  isAdmin,
  deleteAiQuestion
);

export default router;
