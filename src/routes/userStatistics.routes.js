import express from 'express';
import {
  getUserStatistics,
  getProgressTrend,
  getRecommendations,
  updateStatisticsAfterTest
} from '../controllers/userStatistics.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

/**
 * @swagger
 * /api/statistics/overview:
 *   get:
 *     summary: Получить общую статистику пользователя
 *     description: Возвращает гистограмму по пройденным тестам с данными о количестве решенных заданий и правильных ответов по каждому предмету
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешно получена статистика
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     subjectChartData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subjectName:
 *                             type: string
 *                             example: "Математика"
 *                           totalTests:
 *                             type: number
 *                             example: 5
 *                           totalQuestions:
 *                             type: number
 *                             example: 75
 *                           correctAnswers:
 *                             type: number
 *                             example: 60
 *                           averageScore:
 *                             type: number
 *                             example: 80
 *                           accuracy:
 *                             type: number
 *                             example: 80
 *                     weakTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topicName:
 *                             type: string
 *                             example: "Логика"
 *                           subjectName:
 *                             type: string
 *                             example: "Математика"
 *                           averageScore:
 *                             type: number
 *                             example: 43
 *                           testCount:
 *                             type: number
 *                             example: 2
 *                           lastTestDate:
 *                             type: string
 *                             format: date-time
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/overview', getUserStatistics);

/**
 * @swagger
 * /api/statistics/progress:
 *   get:
 *     summary: Получить прогресс пользователя по времени
 *     description: Возвращает линейный график, показывающий как меняется точность пользователя по тестам с течением времени
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: ID предмета для получения прогресса по конкретному предмету (необязательно)
 *     responses:
 *       200:
 *         description: Успешно получен прогресс
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       score:
 *                         type: number
 *                         example: 75
 *       401:
 *         description: Пользователь не авторизован
 *       404:
 *         description: Статистика по предмету не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/progress', getProgressTrend);

/**
 * @swagger
 * /api/statistics/recommendations:
 *   get:
 *     summary: Получить персонализированные рекомендации
 *     description: Возвращает автоматически сгенерированные рекомендации по темам и тестам на основе слабых мест пользователя
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешно получены рекомендации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [topic, test]
 *                             example: "test"
 *                           targetId:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           targetName:
 *                             type: string
 *                             example: "Тест по логике"
 *                           reason:
 *                             type: string
 *                             example: "Повторите тему 'Логика' - ваш средний балл 43%"
 *                           priority:
 *                             type: number
 *                             example: 1
 *                     weakTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topicName:
 *                             type: string
 *                             example: "Логика"
 *                           subjectName:
 *                             type: string
 *                             example: "Математика"
 *                           averageScore:
 *                             type: number
 *                             example: 43
 *                           testCount:
 *                             type: number
 *                             example: 2
 *                           recommendation:
 *                             type: string
 *                             example: "Тебе стоит сосредоточиться на 'Логике' — 43% правильных"
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/recommendations', getRecommendations);

/**
 * @swagger
 * /api/statistics/update:
 *   post:
 *     summary: Обновить статистику пользователя
 *     description: Принудительно обновляет статистику пользователя на основе истории тестов
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Статистика обновлена"
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/update', updateStatisticsAfterTest);

export default router; 