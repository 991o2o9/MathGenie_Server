import express from 'express';
import { generateAdvice, getAdvice } from '../controllers/advice.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Advice
 *   description: Советы от ИИ на основе результатов тестов
 */

/**
 * @swagger
 * /api/advice:
 *   get:
 *     summary: Получить советы пользователя
 *     tags: [Advice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список советов пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   user:
 *                     type: string
 *                   adviceText:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Неавторизован
 */
router.get('/', auth, getAdvice);

/**
 * @swagger
 * /api/advice:
 *   post:
 *     summary: Сгенерировать и сохранить совет для пользователя
 *     tags: [Advice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Совет успешно сгенерирован и сохранён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 user:
 *                   type: string
 *                 adviceText:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Не указан userId
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Нет результатов теста для пользователя
 */
router.post('/', auth, generateAdvice);

export default router;
