import express from 'express';
import {
  createTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,
  getAllTopics,
} from '../controllers/topic.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Topics
 *   description: Управление темами
 */

/**
 * @swagger
 * /topics:
 *   get:
 *     summary: Получить все темы
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subsection
 *         schema:
 *           type: string
 *         description: ID подраздела для фильтрации
 *     responses:
 *       200:
 *         description: Список тем
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /topics/all:
 *   get:
 *     summary: Получить все темы из всех подразделов
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список всех тем
 *       401:
 *         description: Нет или неверный токен
 */
router.get('/all', authMiddleware, getAllTopics);

// Получить все темы (можно фильтровать по subsection)
router.get('/', authMiddleware, getTopics);
// Получить одну тему
router.get('/:id', authMiddleware, getTopic);
// Создать тему (ADMIN)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createTopic);
// Обновить тему (ADMIN)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateTopic);
// Удалить тему (ADMIN)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteTopic);

/**
 * @swagger
 * /topics/{id}:
 *   get:
 *     summary: Получить одну тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные темы
 *       404:
 *         description: Не найдено
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /topics:
 *   post:
 *     summary: Создать тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subsection
 *             properties:
 *               name:
 *                 type: string
 *               explanation:
 *                 type: string
 *               subsection:
 *                 type: string
 *     responses:
 *       201:
 *         description: Тема создана
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /topics/{id}:
 *   put:
 *     summary: Обновить тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               explanation:
 *                 type: string
 *               subsection:
 *                 type: string
 *     responses:
 *       200:
 *         description: Тема обновлена
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /topics/{id}:
 *   delete:
 *     summary: Удалить тему
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Тема удалена
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

export default router;
