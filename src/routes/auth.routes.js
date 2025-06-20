/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход пользователя (логин)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает JWT и данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Неверные учетные данные
 */

import express from 'express';
import {
  login,
  refreshTokenController,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Обновить access-токен по refresh-токену
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh
 *             properties:
 *               refresh:
 *                 type: string
 *                 description: Refresh-токен
 *     responses:
 *       200:
 *         description: Новый access-токен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access:
 *                   type: string
 *                   description: Новый access-токен
 *       400:
 *         description: Нет refresh токена
 *       401:
 *         description: Невалидный refresh токен
 */
router.post('/refresh', refreshTokenController);

export default router;
