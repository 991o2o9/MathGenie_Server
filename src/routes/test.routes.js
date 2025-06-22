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
 *     summary: Получить все доступные тесты (только id и title)
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
 *
 * @swagger
 * /test/user:
 *   get:
 *     summary: Получить тесты текущего пользователя
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список тестов текущего пользователя
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
 *                   topic:
 *                     type: object
 *                   difficulty:
 *                     type: string
 *                   questionCount:
 *                     type: integer
 *                   timeLimit:
 *                     type: integer
 *       500:
 *         description: Ошибка сервера
 *
 * @swagger
 * /test/user/{userId}:
 *   get:
 *     summary: Получить тесты конкретного пользователя (только для админов)
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Список тестов пользователя
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
 *                   topic:
 *                     type: object
 *                   difficulty:
 *                     type: string
 *                   questionCount:
 *                     type: integer
 *                   timeLimit:
 *                     type: integer
 *       403:
 *         description: Недостаточно прав (только для админов)
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 *
 * @swagger
 * /test/answers/{testId}:
 *   get:
 *     summary: Получить ответы и объяснения по ID теста
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID теста
 *     responses:
 *       200:
 *         description: Ответы и объяснения теста
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 difficulty:
 *                   type: string
 *                 totalQuestions:
 *                   type: integer
 *                 subject:
 *                   type: string
 *                 answers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       questionText:
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
 *                       correctOptionId:
 *                         type: string
 *                       selectedOptionId:
 *                         type: string
 *                       isCorrect:
 *                         type: boolean
 *                       explanation:
 *                         type: string
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Тест не найден
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
  getUserTests,
  getUserTestsByAdmin,
  getTestAnswers,
} from '../controllers/test.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getAllTests);
router.get('/user', authMiddleware, getUserTests);
router.get(
  '/user/:userId',
  authMiddleware,
  roleMiddleware('ADMIN'),
  getUserTestsByAdmin
);
router.post('/', authMiddleware, createTest);
// router.post('/pass', authMiddleware, passTest); // old, removed
router.post('/generate', authMiddleware, generateTest);
router.get('/:id', authMiddleware, getTest);
router.post('/submit', authMiddleware, submitTest);

// Получить ответы и объяснения по ID теста
router.get('/answers/:testId', authMiddleware, getTestAnswers);

export default router;
