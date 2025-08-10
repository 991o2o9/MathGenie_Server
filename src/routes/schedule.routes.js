import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isAdmin, isTeacherOrAdmin } from '../middlewares/role.middleware.js';
import {
  getSchedule,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  bulkImportSchedule,
  changeLessonStatus
} from '../controllers/schedule.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Schedule
 *   description: Управление расписанием занятий
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - date
 *         - startTime
 *         - endTime
 *         - title
 *         - teacher
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор занятия
 *         date:
 *           type: string
 *           format: date
 *           description: Дата проведения занятия
 *         startTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Время начала занятия (формат HH:MM)
 *         endTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Время окончания занятия (формат HH:MM)
 *         title:
 *           type: string
 *           description: Тема урока
 *         description:
 *           type: string
 *           description: Краткое описание занятия
 *         format:
 *           type: string
 *           enum: [онлайн, оффлайн, запись]
 *           default: онлайн
 *           description: Формат занятия
 *         status:
 *           type: string
 *           enum: [запланирован, проведён, перенесён, отменён]
 *           default: запланирован
 *           description: Статус занятия
 *         teacher:
 *           type: string
 *           description: Имя преподавателя
 *         materials:
 *           type: array
 *           items:
 *             type: string
 *           description: Ссылки на материалы (PDF, видео, статьи)
 *         streamLink:
 *           type: string
 *           description: Ссылка на трансляцию (если есть)
 *         homework:
 *           type: string
 *           description: Описание домашнего задания
 *         homeworkDeadline:
 *           type: string
 *           format: date
 *           description: Дата сдачи домашнего задания
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления
 *     BulkImportRequest:
 *       type: object
 *       required:
 *         - lessons
 *       properties:
 *         lessons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Schedule'
 *           description: Массив занятий для импорта
 */

/**
 * @swagger
 * /schedule:
 *   get:
 *     summary: Получить расписание занятий
 *     description: Возвращает список всех занятий с возможностью фильтрации. Доступно всем пользователям
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Фильтр по дате (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [запланирован, проведён, перенесён, отменён]
 *         description: Фильтр по статусу занятия
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [онлайн, оффлайн, запись]
 *         description: Фильтр по формату занятия
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         description: Фильтр по имени преподавателя
 *     responses:
 *       200:
 *         description: Список занятий
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
 *                     $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /schedule/{id}:
 *   get:
 *     summary: Получить занятие по ID
 *     description: Возвращает информацию о конкретном занятии. Доступно всем пользователям
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID занятия
 *     responses:
 *       200:
 *         description: Данные занятия
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Занятие не найдено
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /schedule:
 *   post:
 *     summary: Создать новое занятие (только ADMIN)
 *     description: Создаёт новое занятие в расписании и отправляет уведомления всем студентам
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - title
 *               - teacher
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Дата проведения занятия
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Время начала занятия
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Время окончания занятия
 *               title:
 *                 type: string
 *                 description: Тема урока
 *               description:
 *                 type: string
 *                 description: Описание занятия
 *               format:
 *                 type: string
 *                 enum: [онлайн, оффлайн, запись]
 *                 default: онлайн
 *               teacher:
 *                 type: string
 *                 description: Имя преподавателя
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Ссылки на материалы
 *               streamLink:
 *                 type: string
 *                 description: Ссылка на трансляцию
 *               homework:
 *                 type: string
 *                 description: Домашнее задание
 *               homeworkDeadline:
 *                 type: string
 *                 format: date
 *                 description: Срок сдачи ДЗ
 *     responses:
 *       201:
 *         description: Занятие успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Занятие успешно создано"
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Неверные данные или отсутствуют обязательные поля
 *       401:
 *         description: Нет или неверный токен
 *       403:
 *         description: Недостаточно прав (требуется роль администратора)
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /schedule/{id}:
 *   put:
 *     summary: Обновить занятие (ADMIN или учитель своего занятия)
 *     description: Обновляет занятие. Администраторы могут изменять любые занятия, учителя - только свои и не могут менять некоторые поля
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID занятия
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Занятие успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Занятие успешно обновлено"
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Занятие не найдено
 *       403:
 *         description: Недостаточно прав
 *       401:
 *         description: Нет или неверный токен
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /schedule/{id}:
 *   delete:
 *     summary: Удалить занятие (только ADMIN)
 *     description: Удаляет занятие из расписания и отправляет уведомления об отмене всем студентам
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID занятия
 *     responses:
 *       200:
 *         description: Занятие успешно удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Занятие успешно удалено"
 *       404:
 *         description: Занятие не найдено
 *       403:
 *         description: Недостаточно прав (требуется роль администратора)
 *       401:
 *         description: Нет или неверный токен
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /schedule/bulk-import:
 *   post:
 *     summary: Массовый импорт занятий (только ADMIN)
 *     description: Импортирует несколько занятий одновременно из массива данных и отправляет уведомления студентам
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkImportRequest'
 *     responses:
 *       200:
 *         description: Импорт завершён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Импортировано 5 занятий"
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *                       description: Успешно созданные занятия
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lesson:
 *                             type: object
 *                             description: Данные занятия с ошибкой
 *                           error:
 *                             type: string
 *                             description: Описание ошибки
 *       400:
 *         description: Неверный формат данных для импорта
 *       403:
 *         description: Недостаточно прав (требуется роль администратора)
 *       401:
 *         description: Нет или неверный токен
 *       500:
 *         description: Ошибка при массовом импорте
 */

/**
 * @swagger
 * /schedule/{id}/status:
 *   patch:
 *     summary: Изменить статус занятия (ADMIN или учитель своего занятия)
 *     description: Изменяет статус занятия. Учителя не могут отменять занятия и могут изменять только свои занятия
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID занятия
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [запланирован, проведён, перенесён, отменён]
 *                 description: Новый статус занятия
 *     responses:
 *       200:
 *         description: Статус успешно изменён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Статус занятия успешно изменён"
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Занятие не найдено
 *       403:
 *         description: Недостаточно прав (учитель не может отменять или изменять чужие занятия)
 *       401:
 *         description: Нет или неверный токен
 *       500:
 *         description: Ошибка при изменении статуса
 */

// Публичные маршруты (для просмотра расписания)
router.get('/', getSchedule);
router.get('/:id', getScheduleById);

// Защищенные маршруты для администраторов
router.post('/',
  authMiddleware,
  isAdmin,
  createSchedule
);

router.delete('/:id',
  authMiddleware,
  isAdmin,
  deleteSchedule
);

router.post('/bulk-import',
  authMiddleware,
  isAdmin,
  bulkImportSchedule
);

// Защищенные маршруты для администраторов и учителей
router.put('/:id',
  authMiddleware,
  isTeacherOrAdmin,
  updateSchedule
);

router.patch('/:id/status',
  authMiddleware,
  isTeacherOrAdmin,
  changeLessonStatus
);

export default router;