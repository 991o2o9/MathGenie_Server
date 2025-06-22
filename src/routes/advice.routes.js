import express from 'express';
import { getAdvice } from '../controllers/advice.controller.js';
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

export default router;
