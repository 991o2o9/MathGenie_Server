import express from 'express';
import {
  getStudentGroup,
  getStudentLessons,
  getStudentLesson,
  getStudentSchedule,
  submitHomework,
  getStudentHomework,
  submitStandup,
  getStudentProgress
} from '../controllers/student.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isStudentOrTeacher } from '../middlewares/role.middleware.js';

const router = express.Router();

// Все роуты требуют авторизации и роли ученика
router.use(authMiddleware);
router.use(isStudentOrTeacher);

/**
 * @swagger
 * /student/group:
 *   get:
 *     summary: Получить информацию о группе ученика
 *     description: Возвращает информацию о группе, в которой состоит ученик
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешно получена информация о группе
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: "Группа А-1"
 *                     description:
 *                       type: string
 *                     teacher:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                     course:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         level:
 *                           type: string
 *                         duration:
 *                           type: number
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                     studentCount:
 *                       type: number
 *                     maxStudents:
 *                       type: number
 *                     status:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     meetingLink:
 *                       type: string
 *                     notes:
 *                       type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Ученик не состоит в группе
 *       500:
 *         description: Ошибка сервера
 */
router.get('/group', getStudentGroup);

/**
 * @swagger
 * /student/lessons:
 *   get:
 *     summary: Получить уроки курса ученика
 *     description: Возвращает список уроков курса, на который записан ученик
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Фильтр по статусу урока
 *     responses:
 *       200:
 *         description: Успешно получены уроки
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       videoUrl:
 *                         type: string
 *                       videoDuration:
 *                         type: number
 *                       order:
 *                         type: number
 *                       duration:
 *                         type: number
 *                       materials:
 *                         type: array
 *                       homework:
 *                         type: object
 *                       status:
 *                         type: string
 *                       tags:
 *                         type: array
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Ученик не состоит в группе
 *       500:
 *         description: Ошибка сервера
 */
router.get('/lessons', getStudentLessons);

/**
 * @swagger
 * /student/lessons/{id}:
 *   get:
 *     summary: Получить детали конкретного урока
 *     description: Возвращает подробную информацию об уроке с проверкой доступа
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID урока
 *     responses:
 *       200:
 *         description: Успешно получены детали урока
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
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                     videoDuration:
 *                       type: number
 *                     order:
 *                       type: number
 *                     duration:
 *                       type: number
 *                     materials:
 *                       type: array
 *                     homework:
 *                       type: object
 *                     status:
 *                       type: string
 *                     tags:
 *                       type: array
 *                     course:
 *                       type: object
 *                     hasHomework:
 *                       type: boolean
 *                     homeworkStatus:
 *                       type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Урок не найден или нет доступа
 *       500:
 *         description: Ошибка сервера
 */
router.get('/lessons/:id', getStudentLesson);

/**
 * @swagger
 * /student/schedule:
 *   get:
 *     summary: Получить расписание ученика
 *     description: Возвращает расписание занятий для группы ученика
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата для фильтрации
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата для фильтрации
 *     responses:
 *       200:
 *         description: Успешно получено расписание
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       lesson:
 *                         type: object
 *                       course:
 *                         type: object
 *                       group:
 *                         type: object
 *                       date:
 *                         type: string
 *                         format: date
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       status:
 *                         type: string
 *                       statusText:
 *                         type: string
 *                       meetingLink:
 *                         type: string
 *                       meetingPassword:
 *                         type: string
 *                       location:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       recordingUrl:
 *                         type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Ученик не состоит в группе
 *       500:
 *         description: Ошибка сервера
 */
router.get('/schedule', getStudentSchedule);

/**
 * @swagger
 * /student/homework:
 *   post:
 *     summary: Отправить домашнее задание
 *     description: Позволяет ученику отправить домашнее задание по уроку
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *             properties:
 *               lessonId:
 *                 type: string
 *                 description: ID урока
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                     size:
 *                       type: number
 *                 description: Загруженные файлы
 *               text:
 *                 type: string
 *                 description: Текстовое описание работы
 *     responses:
 *       201:
 *         description: Домашнее задание успешно отправлено
 *       400:
 *         description: Домашнее задание уже отправлено
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Урок не найден или нет доступа
 *       500:
 *         description: Ошибка сервера
 */
router.post('/homework', submitHomework);

/**
 * @swagger
 * /student/homework:
 *   get:
 *     summary: Получить домашние задания ученика
 *     description: Возвращает список домашних заданий, отправленных учеником
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, graded, overdue]
 *         description: Фильтр по статусу домашнего задания
 *     responses:
 *       200:
 *         description: Успешно получены домашние задания
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       lesson:
 *                         type: object
 *                       course:
 *                         type: object
 *                       group:
 *                         type: object
 *                       status:
 *                         type: string
 *                       statusText:
 *                         type: string
 *                       grade:
 *                         type: number
 *                       teacherComment:
 *                         type: string
 *                       submittedAt:
 *                         type: string
 *                         format: date-time
 *                       gradedAt:
 *                         type: string
 *                         format: date-time
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       isLate:
 *                         type: boolean
 *                       files:
 *                         type: array
 *                       text:
 *                         type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       500:
 *         description: Ошибка сервера
 */
router.get('/homework', getStudentHomework);

/**
 * @swagger
 * /student/standup:
 *   post:
 *     summary: Отправить стендап
 *     description: Позволяет ученику отправить стендап (видео/текст/аудио) по уроку
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - type
 *               - content
 *             properties:
 *               lessonId:
 *                 type: string
 *                 description: ID урока
 *               type:
 *                 type: string
 *                 enum: [video, text, audio]
 *                 description: Тип стендапа
 *               content:
 *                 type: string
 *                 description: URL видео/аудио или текст
 *               title:
 *                 type: string
 *                 description: Заголовок стендапа
 *               description:
 *                 type: string
 *                 description: Описание стендапа
 *     responses:
 *       201:
 *         description: Стендап успешно отправлен
 *       400:
 *         description: Стендап уже отправлен
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Урок не найден или нет доступа
 *       500:
 *         description: Ошибка сервера
 */
router.post('/standup', submitStandup);

/**
 * @swagger
 * /student/progress:
 *   get:
 *     summary: Получить прогресс ученика по курсу
 *     description: Возвращает подробную информацию о прогрессе ученика по курсу
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     group:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         teacher:
 *                           type: object
 *                     course:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         level:
 *                           type: string
 *                         duration:
 *                           type: number
 *                     progress:
 *                       type: object
 *                       properties:
 *                         totalLessons:
 *                           type: number
 *                         completedLessons:
 *                           type: number
 *                         completionPercentage:
 *                           type: number
 *                         gradedHomework:
 *                           type: number
 *                         avgGrade:
 *                           type: number
 *                     lessonProgress:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           order:
 *                             type: number
 *                           status:
 *                             type: string
 *                           hasHomework:
 *                             type: boolean
 *                           homeworkStatus:
 *                             type: string
 *                           homeworkGrade:
 *                             type: number
 *                           hasStandup:
 *                             type: boolean
 *                           standupStatus:
 *                             type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Ученик не состоит в группе
 *       500:
 *         description: Ошибка сервера
 */
router.get('/progress', getStudentProgress);

export default router; 