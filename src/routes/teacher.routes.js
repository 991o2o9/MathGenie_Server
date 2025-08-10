import express from 'express';
import {
  getTeacherGroups,
  createGroup,
  updateGroup,
  getHomeworkForGrading,
  gradeHomework,
  getGroupStatistics,
  getAvailableStudents
} from '../controllers/teacher.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

// Все роуты требуют авторизации и роли учителя
router.use(authMiddleware);
router.use(isTeacherOrAdmin);

/**
 * @swagger
 * /teacher/groups:
 *   get:
 *     summary: Получить все группы учителя
 *     description: Возвращает список всех групп, которыми управляет учитель
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, completed]
 *         description: Фильтр по статусу группы
 *     responses:
 *       200:
 *         description: Успешно получены группы
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
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                         example: "Группа А-1"
 *                       description:
 *                         type: string
 *                       course:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           level:
 *                             type: string
 *                       students:
 *                         type: array
 *                         items:
 *                           type: object
 *                       studentCount:
 *                         type: number
 *                       maxStudents:
 *                         type: number
 *                       status:
 *                         type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       500:
 *         description: Ошибка сервера
 */
router.get('/groups', getTeacherGroups);

/**
 * @swagger
 * /teacher/groups:
 *   post:
 *     summary: Создать новую группу
 *     description: Создает новую группу с указанными учениками и курсом
 *     tags: [Teacher]
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
 *               - courseId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Группа А-1"
 *               description:
 *                 type: string
 *                 example: "Группа для изучения основ математики"
 *               courseId:
 *                 type: string
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxStudents:
 *                 type: number
 *                 default: 15
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Группа успешно создана
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Курс не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post('/groups', createGroup);

/**
 * @swagger
 * /teacher/groups/{id}:
 *   put:
 *     summary: Обновить группу
 *     description: Обновляет информацию о группе
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID группы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               courseId:
 *                 type: string
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxStudents:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, archived, completed]
 *     responses:
 *       200:
 *         description: Группа успешно обновлена
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Группа не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/groups/:id', updateGroup);

/**
 * @swagger
 * /teacher/homework:
 *   get:
 *     summary: Получить домашние задания для оценки
 *     description: Возвращает список домашних заданий учеников для оценки учителем
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, graded, overdue, draft]
 *         description: Фильтр по статусу домашнего задания
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Фильтр по группе
 *       - in: query
 *         name: lessonId
 *         schema:
 *           type: string
 *         description: Фильтр по уроку
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
 *                       student:
 *                         type: object
 *                       lesson:
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
router.get('/homework', getHomeworkForGrading);

/**
 * @swagger
 * /teacher/homework/{id}:
 *   put:
 *     summary: Оценить домашнее задание
 *     description: Позволяет учителю поставить оценку и оставить комментарий к домашнему заданию
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID домашнего задания
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Оценка от 0 до 100
 *               teacherComment:
 *                 type: string
 *                 description: Комментарий учителя
 *     responses:
 *       200:
 *         description: Домашнее задание успешно оценено
 *       400:
 *         description: Некорректная оценка
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Домашнее задание не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.put('/homework/:id', gradeHomework);

/**
 * @swagger
 * /teacher/statistics:
 *   get:
 *     summary: Получить статистику по группам
 *     description: Возвращает статистику по домашним заданиям и стендапам для всех групп учителя
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: ID конкретной группы (необязательно)
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                       groupName:
 *                         type: string
 *                       courseName:
 *                         type: string
 *                       studentCount:
 *                         type: number
 *                       maxStudents:
 *                         type: number
 *                       status:
 *                         type: string
 *                       homework:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: number
 *                           submitted:
 *                             type: number
 *                           graded:
 *                             type: number
 *                           overdue:
 *                             type: number
 *                           avgGrade:
 *                             type: number
 *                       standups:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: number
 *                           submitted:
 *                             type: number
 *                           reviewed:
 *                             type: number
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       500:
 *         description: Ошибка сервера
 */
router.get('/statistics', getGroupStatistics);

/**
 * @swagger
 * /teacher/students:
 *   get:
 *     summary: Получить доступных учеников
 *     description: Возвращает список учеников, которых можно добавить в группу
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: ID группы (для исключения уже добавленных учеников)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени или username
 *     responses:
 *       200:
 *         description: Успешно получены ученики
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
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profile:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Пользователь не авторизован
 *       403:
 *         description: Недостаточно прав
 *       500:
 *         description: Ошибка сервера
 */
router.get('/students', getAvailableStudents);

export default router; 