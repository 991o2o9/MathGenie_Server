/**
 * @swagger
 * tags:
 *   name: OrtSamples
 *   description: Управление пробниками (OrtSample)
 */

/**
 * @swagger
 * /ort-samples:
 *   get:
 *     summary: Получить все пробники
 *     tags: [OrtSamples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: ID темы для фильтрации
 *     responses:
 *       200:
 *         description: Список пробников
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /ort-samples/{id}:
 *   get:
 *     summary: Получить один пробник
 *     tags: [OrtSamples]
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
 *         description: Данные пробника
 *       404:
 *         description: Не найдено
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /ort-samples:
 *   post:
 *     summary: Создать пробник (текст или файл)
 *     tags: [OrtSamples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               topic:
 *                 type: string
 *             required:
 *               - topic
 *     responses:
 *       201:
 *         description: Пробник создан
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /ort-samples/{id}:
 *   put:
 *     summary: Обновить пробник (текст или файл)
 *     tags: [OrtSamples]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               topic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пробник обновлён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /ort-samples/{id}:
 *   delete:
 *     summary: Удалить пробник
 *     tags: [OrtSamples]
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
 *         description: Пробник удалён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

// Роуты для управления пробниками (OrtSample)
// ...

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  createOrtSample,
  getOrtSamples,
  getOrtSample,
  updateOrtSample,
  deleteOrtSample,
} from '../controllers/ortSample.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads') });

// Получить все пробники (можно фильтровать по topic)
router.get('/', authMiddleware, getOrtSamples);
// Получить один пробник
router.get('/:id', authMiddleware, getOrtSample);
// Создать пробник (ADMIN, поддержка файла)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('ADMIN'),
  upload.single('file'),
  createOrtSample
);
// Обновить пробник (ADMIN, поддержка файла)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('ADMIN'),
  upload.single('file'),
  updateOrtSample
);
// Удалить пробник (ADMIN)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteOrtSample);

export default router;
