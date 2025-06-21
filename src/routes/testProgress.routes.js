import express from 'express';
import {
  saveProgress,
  getUserProgress,
  getSpecificTestProgress,
  deleteProgress,
} from '../controllers/testProgress.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Прогресс Теста
 *   description: API для управления прогрессом пользователей в тестах
 */

/**
 * @swagger
 * /api/test-progress/save:
 *   post:
 *     summary: Сохранить или обновить прогресс пользователя в тесте
 *     tags: [Прогресс Теста]
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
 *               currentQuestionIndex:
 *                 type: integer
 *               timeLeft:
 *                 type: integer
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
 *         description: Прогресс успешно сохранён
 *       400:
 *         description: Неверный запрос
 *       500:
 *         description: Ошибка сервера
 */
router.post('/save', saveProgress);

/**
 * @swagger
 * /api/test-progress/{userId}:
 *   get:
 *     summary: Получить все незавершённые тесты пользователя
 *     tags: [Прогресс Теста]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список незавершённых тестов
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
 *                   progress:
 *                     type: integer
 *                   timeLeft:
 *                     type: integer
 *                   currentQuestionIndex:
 *                     type: integer
 *                   status:
 *                     type: string
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:userId', getUserProgress);

/**
 * @swagger
 * /api/test-progress/{userId}/{testId}:
 *   get:
 *     summary: Получить прогресс по конкретному тесту пользователя
 *     tags: [Прогресс Теста]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Объект с прогрессом теста
 *       404:
 *         description: Прогресс не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:userId/:testId', getSpecificTestProgress);

/**
 * @swagger
 * /api/test-progress/{userId}/{testId}:
 *   delete:
 *     summary: Удалить прогресс по тесту пользователя
 *     tags: [Прогресс Теста]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Прогресс успешно удалён
 *       404:
 *         description: Прогресс не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/:userId/:testId', deleteProgress);

export default router;
