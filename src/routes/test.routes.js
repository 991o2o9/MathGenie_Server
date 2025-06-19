/**
 * @swagger
 * /test/pass:
 *   post:
 *     summary: Прохождение теста пользователем
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answerIndex:
 *                       type: integer
 *               testId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Результат теста
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultPercent:
 *                   type: number
 *                 correct:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       401:
 *         description: Нет или неверный токен
 */
// Роуты для управления тестами
// ...

import express from 'express';
import { passTest } from '../controllers/test.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/pass', authMiddleware, passTest);

export default router;
