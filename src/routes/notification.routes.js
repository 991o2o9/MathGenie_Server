import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';
import {
  getUserNotificationsController,
  markNotificationAsReadController,
  getUnreadCountController,
  deleteNotificationController,
  getAllNotificationsController,
  checkAndNotifyUnpaidStudentsController,
  checkOverduePaymentsController,
  sendPaymentNotificationController,
  checkUnpaidStudentsController,
  testPaymentNotificationsController
} from '../controllers/notification.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Управление уведомлениями пользователей
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор уведомления
 *         type:
 *           type: string
 *           enum: [new_lesson, lesson_updated, lesson_cancelled, lesson_status_changed, homework_assigned, reminder]
 *           description: Тип уведомления
 *         title:
 *           type: string
 *           description: Заголовок уведомления
 *         message:
 *           type: string
 *           description: Текст уведомления
 *         lessonId:
 *           type: string
 *           description: ID связанного занятия
 *         teacher:
 *           type: string
 *           description: Имя преподавателя
 *         date:
 *           type: string
 *           format: date-time
 *           description: Дата события
 *         isRead:
 *           type: boolean
 *           description: Статус прочтения для текущего пользователя
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: Дата прочтения
 *         metadata:
 *           type: object
 *           description: Дополнительные данные
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *     UnreadCount:
 *       type: object
 *       properties:
 *         unreadCount:
 *           type: number
 *           description: Общее количество непрочитанных
 *         byType:
 *           type: object
 *           properties:
 *             new_lesson:
 *               type: number
 *             lesson_updated:
 *               type: number
 *             lesson_cancelled:
 *               type: number
 *             lesson_status_changed:
 *               type: number
 *             homework_assigned:
 *               type: number
 *             reminder:
 *               type: number
 */

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     summary: Получить уведомления текущего пользователя
 *     description: Возвращает список уведомлений для авторизованного пользователя с пагинацией и фильтрами
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *           maximum: 100
 *         description: Количество на странице
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Фильтр по статусу прочтения
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [new_lesson, lesson_updated, lesson_cancelled, lesson_status_changed, homework_assigned, reminder]
 *         description: Фильтр по типу уведомления
 *     responses:
 *       200:
 *         description: Список уведомлений пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Получить количество непрочитанных уведомлений
 *     description: Возвращает общее количество непрочитанных уведомлений с детализацией по типам
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество непрочитанных уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UnreadCount'
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Отметить уведомление как прочитанное
 *     description: Отмечает конкретное уведомление как прочитанное для текущего пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление отмечено как прочитанное
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Уведомление отмечено как прочитанное"
 *       404:
 *         description: Уведомление не найдено
 *       403:
 *         description: Недостаточно прав
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Удалить уведомление для пользователя
 *     description: Помечает уведомление как удалённое для текущего пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Уведомление успешно удалено"
 *       404:
 *         description: Уведомление не найдено
 *       403:
 *         description: Недостаточно прав
 *       401:
 *         description: Нет или неверный токен
 */

/**
 * @swagger
 * /notifications/admin/all:
 *   get:
 *     summary: Получить все уведомления (только ADMIN)
 *     description: Возвращает все уведомления в системе с фильтрацией и пагинацией. Доступно только администраторам
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *           maximum: 200
 *         description: Количество на странице
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Фильтр по пользователю
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [new_lesson, lesson_updated, lesson_cancelled, lesson_status_changed, homework_assigned, reminder]
 *         description: Фильтр по типу
 *       - in: query
 *         name: lessonId
 *         schema:
 *           type: string
 *         description: Фильтр по занятию
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Фильтр от даты
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Фильтр до даты
 *     responses:
 *       200:
 *         description: Список всех уведомлений с административной информацией
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Notification'
 *                           - type: object
 *                             properties:
 *                               recipients:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     userId:
 *                                       type: string
 *                                     userName:
 *                                       type: string
 *                                     userEmail:
 *                                       type: string
 *                                     read:
 *                                       type: boolean
 *                                     readAt:
 *                                       type: string
 *                                       format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalCount:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalNotifications:
 *                           type: number
 *                         unreadNotifications:
 *                           type: number
 *                         readPercentage:
 *                           type: number
 *       403:
 *         description: Недостаточно прав (требуется роль администратора)
 *       401:
 *         description: Нет или неверный токен
 */

// Тестовый роут для уведомлений об оплате (без аутентификации, только для разработки)
router.post('/test-payment-notifications', testPaymentNotificationsController);

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Получить уведомления текущего пользователя
router.get('/my', getUserNotificationsController);

// Получить количество непрочитанных уведомлений
router.get('/unread-count', getUnreadCountController);

// Отметить уведомление как прочитанное
router.patch('/:id/read', markNotificationAsReadController);

// Удалить уведомление для пользователя
router.delete('/:id', deleteNotificationController);

// Административные маршруты
router.get('/admin/all', isAdmin, getAllNotificationsController);

// Новые роуты для уведомлений об оплате (только для администраторов)
router.post('/admin/check-unpaid-students', isAdmin, checkAndNotifyUnpaidStudentsController);
router.post('/admin/check-overdue-payments', isAdmin, checkOverduePaymentsController);
router.post('/admin/send-payment-notification', isAdmin, sendPaymentNotificationController);
router.get('/admin/check-unpaid-students', isAdmin, checkUnpaidStudentsController);

export default router;