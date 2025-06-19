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
// Роуты для аутентификации
// ...

const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

router.post('/login', login);

module.exports = router;
