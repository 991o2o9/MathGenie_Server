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
 *
 * @swagger
 * /test/generate:
 *   post:
 *     summary: Генерация теста по топику и сложности
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
 *               topicId:
 *                 type: string
 *                 description: ID топика
 *               difficulty:
 *                 type: string
 *                 enum: [начальный, средний, продвинутый]
 *                 description: Сложность теста
 *     responses:
 *       201:
 *         description: Сгенерированный тест
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       text:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             optionId:
 *                               type: string
 *                             text:
 *                               type: string
 *                 timeLimit:
 *                   type: integer
 *                   description: Время на тест (секунды)
 *       400:
 *         description: Ошибка запроса
 *       404:
 *         description: Топик или ort_sample не найден
 *
 * @swagger
 * /test/{id}:
 *   get:
 *     summary: Получить тест по id (без правильных ответов)
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID теста
 *     responses:
 *       200:
 *         description: Тест
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       text:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             optionId:
 *                               type: string
 *                             text:
 *                               type: string
 *                 timeLimit:
 *                   type: integer
 *       404:
 *         description: Тест не найден
 *
 * @swagger
 * /test/submit:
 *   post:
 *     summary: Проверка теста и получение результата
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
 *               testId:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOptionId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Результат теста
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 correctAnswers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       correctOptionId:
 *                         type: string
 *       404:
 *         description: Тест не найден
 *
 * @swagger
 * /test:
 *   get:
 *     summary: Получить все тесты (только id и title)
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список тестов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   testId:
 *                     type: string
 *                   title:
 *                     type: string
 *       500:
 *         description: Ошибка сервера
 */
// Роуты для управления тестами
// ...

import express from 'express';
import {
  generateTest,
  getTest,
  submitTest,
  createTest,
  getAllTests,
} from '../controllers/test.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAllTests);
router.post('/', authMiddleware, createTest);
// router.post('/pass', authMiddleware, passTest); // old, removed
router.post('/generate', authMiddleware, generateTest);
router.get('/:id', authMiddleware, getTest);
router.post('/submit', authMiddleware, submitTest);

export default router;
