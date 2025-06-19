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

const express = require('express');
const router = express.Router();
const { passTest } = require('../controllers/test.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/pass', authMiddleware, passTest);

module.exports = router;
