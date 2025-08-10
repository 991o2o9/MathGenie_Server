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
 * /advice:
 *   get:
 *     summary: Получить советы пользователя
 *     description: Возвращает персонализированные советы от ИИ на основе результатов тестов пользователя
 *     tags: [Advice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID пользователя (если не передан, используется текущий авторизованный пользователь)
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
 *                     example: "507f1f77bcf86cd799439011"
 *                     description: Уникальный идентификатор совета
 *                   user:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439012"
 *                     description: ID пользователя
 *                   adviceText:
 *                     type: string
 *                     example: "На основе анализа ваших последних тестов, я вижу прогресс в математике. Рекомендую сосредоточиться на теме 'Логика'..."
 *                     description: Текст совета от ИИ
 *                   createdAt:
 *                     type: string
 *                     example: "15.12.2024"
 *                     description: Дата создания совета в формате DD.MM.YYYY
 *       400:
 *         description: Не указан ID пользователя
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', auth, getAdvice);

export default router;
