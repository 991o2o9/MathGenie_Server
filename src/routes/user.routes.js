const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями (только для ADMIN)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получить всех пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Получить одного пользователя
 *     tags: [Users]
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
 *         description: Данные пользователя
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Создать пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       409:
 *         description: Уже существует
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Обновить пользователя
 *     tags: [Users]
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
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *     responses:
 *       200:
 *         description: Пользователь обновлён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags: [Users]
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
 *         description: Пользователь удалён
 *       404:
 *         description: Не найдено
 *       403:
 *         description: Недостаточно прав
 */

// Получить всех пользователей (ADMIN)
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getUsers);
// Получить одного пользователя (ADMIN)
router.get('/:id', authMiddleware, roleMiddleware('ADMIN'), getUser);
// Создать пользователя (ADMIN)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createUser);
// Обновить пользователя (ADMIN)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateUser);
// Удалить пользователя (ADMIN)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteUser);

module.exports = router;
