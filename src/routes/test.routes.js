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
 *               customTopicName:
 *                 type: string
 *                 description: Пользовательская тема (если не выбран topicId)
 *               customTopicDescription:
 *                 type: string
 *                 description: Описание пользовательской темы (опционально)
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
  getAllTests,
  getUserTests,
  getTestAnswers,
} from '../controllers/test.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Debug middleware for test routes
router.use((req, res, next) => {
  console.log(`Test route accessed: ${req.method} ${req.path}`);
  next();
});

// Test route to verify the endpoint is working
router.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.status(200).json({ message: 'Test routes are working' });
});

// Example endpoint to show correct JSON format
router.get('/generate/example', (req, res) => {
  res.status(200).json({
    message: 'Example JSON format for test generation',
    example: {
      difficulty: 'начальный',
      customTopicName: 'Математика',
      customTopicDescription:
        'Тест по основам математики включая алгебру и геометрию. Вопросы охватывают основные темы школьной программы: числа, уравнения, функции, геометрические фигуры, площади и объемы.',
    },
    note: 'Make sure to properly escape newlines and special characters in JSON. Use \\n for newlines and escape quotes with \\".',
  });
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all tests
router.get('/', getAllTests);

// Get user's tests
router.get('/user', getUserTests);

// Generate test - this should be accessible at /test/generate
router.post('/generate', generateTest);

// Submit test answers
router.post('/submit', submitTest);

// Get test answers and explanations - this should come before /:id
router.get('/answers/:testId', getTestAnswers);

// Get test by ID - this should be last to avoid conflicts with other routes
router.get('/:id', getTest);

export default router;
