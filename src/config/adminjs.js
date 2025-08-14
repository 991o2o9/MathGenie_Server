// AdminJS Config

import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Subsection from '../models/subsection.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import TestHistory from '../models/testHistory.model.js';
import AiQuestion from '../models/aiQuestion.model.js';
import Test from '../models/test.model.js';
import TestProgress from '../models/testProgress.model.js';
import UserStatistics from '../models/userStatistics.model.js';
import Course from '../models/course.model.js';
import Group from '../models/group.model.js';
import Lesson from '../models/lesson.model.js';
import Homework from '../models/homework.model.js';
import Schedule from '../models/schedule.model.js';
import Standup from '../models/standup.model.js';
import Notification from '../models/notification.model.js';
import { hashPassword } from '../utils/bcrypt.js';
import { askHuggingFace } from '../utils/huggingface.js';
import { sendPaymentNotification } from '../utils/notifications.js';
import Advice from '../models/advice.model.js';
import StudentPayment from '../models/studentPayment.model.js';

async function getAdminConfig() {
  const { dark, light, noSidebar } = await import('@adminjs/themes');
  const AdminJS = (await import('adminjs')).default;
  const AdminJSExpress = (await import('@adminjs/express')).default;
  const AdminJSMongoose = await import('@adminjs/mongoose');

  AdminJS.registerAdapter({
    Database: AdminJSMongoose.Database,
    Resource: AdminJSMongoose.Resource,
  });

  const adminJs = new AdminJS({
    defaultTheme: dark.id,
    availableThemes: [dark, light],
    resources: [
      {
        resource: User,
        options: {
          navigation: { name: 'Users', icon: 'User' },
          properties: {
            _id: { isVisible: false },
            id: { isVisible: false },
            username: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
            },
            password: {
              isVisible: {
                list: false,
                filter: false,
                show: false,
                edit: false,
                create: false,
              },
              type: 'password',
            },
            plainPassword: {
              isVisible: {
                list: true,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              type: 'password',
              isTitle: false,
              label: 'Пароль',
            },
            role: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              availableValues: [
                { value: 'ADMIN', label: 'Администратор' },
                { value: 'TEACHER', label: 'Учитель' },
                { value: 'STUDENT', label: 'Студент' },
              ],
            },
            group: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'Group',
            },
            courses: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'Course',
              type: 'mixed',
            },
            'profile.firstName': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
              label: 'Имя',
            },
            'profile.lastName': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
              label: 'Фамилия',
            },
            'profile.email': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
              label: 'Email',
            },
            'profile.phone': {
              isVisible: {
                list: true,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
              label: 'Телефон',
            },
            'profile.avatar': {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
              label: 'URL аватара',
            },
            'profile.bio': {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              type: 'textarea',
              label: 'Биография',
            },

            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
            },
          },
          listProperties: ['username', 'plainPassword', 'profile.firstName', 'profile.lastName', 'role', 'group', 'createdAt'],
          showProperties: ['username', 'plainPassword', 'role', 'group', 'courses', 'profile.firstName', 'profile.lastName', 'profile.email', 'profile.phone', 'profile.avatar', 'profile.bio', 'createdAt'],
          editProperties: ['username', 'plainPassword', 'role', 'group', 'courses', 'profile.firstName', 'profile.lastName', 'profile.email', 'profile.phone', 'profile.avatar', 'profile.bio'],
          createProperties: ['username', 'plainPassword', 'role', 'group', 'courses', 'profile.firstName', 'profile.lastName', 'profile.email', 'profile.phone', 'profile.avatar', 'profile.bio'],
          filterProperties: ['username', 'role', 'group', 'profile.firstName', 'profile.lastName', 'profile.email'],
          label: 'Users',
          actions: {
            new: {
              before: async (request) => {
                if (request.payload && request.payload.plainPassword) {
                  // Сохраняем исходный пароль в plainPassword
                  const originalPassword = request.payload.plainPassword;
                  // Хешируем пароль для поля password
                  request.payload.password = await hashPassword(originalPassword);
                  // plainPassword уже содержит исходный пароль, оставляем как есть
                }
                return request;
              },
            },
            edit: {
              before: async (request) => {
                if (request.payload && request.payload.plainPassword) {
                  // Сохраняем исходный пароль в plainPassword
                  const originalPassword = request.payload.plainPassword;
                  // Хешируем пароль для поля password
                  request.payload.password = await hashPassword(originalPassword);
                  // plainPassword уже содержит исходный пароль, оставляем как есть
                } else if (request.payload) {
                  // Если пароль не изменялся, удаляем его из payload
                  delete request.payload.password;
                  delete request.payload.plainPassword;
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: StudentPayment,
        options: {
          navigation: { name: 'Payment', icon: 'CreditCard' },
          label: 'Статус оплаты студентов',
          properties: {
            _id: { isVisible: false },
            username: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'string',
              label: 'Имя пользователя',
            },
            firstName: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'string',
              label: 'Имя',
            },
            lastName: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'string',
              label: 'Фамилия',
            },
            email: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'string',
              label: 'Email',
            },
            phone: {
              isVisible: {
                list: true,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'string',
              label: 'Телефон',
            },
            group: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              reference: 'Group',
              label: 'Группа',
            },
            'payment.status': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: false,
              },
              availableValues: [
                { value: 'unpaid', label: '❌ Не оплачено' },
                { value: 'pending', label: '⏳ В ожидании' },
                { value: 'paid', label: '✅ Оплачено' },
                { value: 'overdue', label: '🚨 Просрочено' },
                { value: 'cancelled', label: '❌ Отменено' },
              ],
              label: 'Статус оплаты',
            },
            'payment.amount': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: false,
              },
              type: 'number',
              label: 'Сумма к оплате',
            },
            'payment.paidAmount': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: false,
              },
              type: 'number',
              label: 'Оплаченная сумма',
            },
            'payment.dueDate': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: false,
              },
              type: 'date',
              label: 'Дата оплаты',
            },
            'payment.lastPaymentDate': {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата последней оплаты',
            },
            'payment.notes': {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: false,
              },
              type: 'textarea',
              label: 'Комментарии',
            },
            'payment.updatedAt': {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Обновлено',
            },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата регистрации',
            },
          },
          listProperties: ['username', 'firstName', 'lastName', 'group', 'payment.status', 'payment.amount', 'payment.paidAmount', 'payment.dueDate', 'payment.updatedAt'],
          showProperties: ['username', 'firstName', 'lastName', 'email', 'phone', 'group', 'payment.status', 'payment.amount', 'payment.paidAmount', 'payment.dueDate', 'payment.lastPaymentDate', 'payment.notes', 'payment.updatedAt', 'createdAt'],
          editProperties: ['payment.status', 'payment.amount', 'payment.paidAmount', 'payment.dueDate', 'payment.notes'],
          filterProperties: ['username', 'firstName', 'lastName', 'email', 'group', 'payment.status', 'payment.amount', 'payment.dueDate'],
          sort: {
            direction: 'desc',
            sortBy: 'payment.updatedAt',
          },
          actions: {
            new: { isAccessible: false },
            delete: { isAccessible: false },
            edit: {
              after: async (response, request, context) => {
                console.log('🔍 [ADMIN] Действие edit в StudentPayment вызвано');
                console.log('📋 [ADMIN] Request payload:', JSON.stringify(request.payload, null, 2));
                console.log('📋 [ADMIN] Record params:', JSON.stringify(context.record.params, null, 2));
                
                const { record } = context;
                const { payload } = request;
                
                // Проверяем, есть ли данные об оплате в payload
                if (payload && payload['payment.status']) {
                  console.log(`🔄 [ADMIN] Статус оплаты в payload: ${payload['payment.status']}`);
                  console.log(`🔄 [ADMIN] Статус оплаты в record: ${record.params['payment.status']}`);
                  
                  // Проверяем, изменились ли данные об оплате
                  const paymentFields = ['payment.status', 'payment.amount', 'payment.paidAmount', 'payment.dueDate', 'payment.notes'];
                  let hasChanges = false;
                  
                  for (const field of paymentFields) {
                    if (payload[field] !== record.params[field]) {
                      console.log(`🔄 [ADMIN] Поле ${field} изменилось: ${record.params[field]} -> ${payload[field]}`);
                      hasChanges = true;
                    }
                  }
                  
                  if (hasChanges) {
                    console.log(`✅ [ADMIN] Данные об оплате изменились! Отправляем уведомление...`);
                  } else {
                    console.log(`✅ [ADMIN] Отправляем уведомление о текущем статусе...`);
                  }
                  
                  try {
                    const userId = record.params._id || record.params.id;
                    console.log(`📞 [ADMIN] Вызываем sendPaymentNotification с ID: ${userId}, статус: ${payload['payment.status']}`);
                    await sendPaymentNotification(userId, payload['payment.status']);
                    console.log(`💰 [ADMIN] Уведомление отправлено студенту ${record.params.username} (статус: ${payload['payment.status']})`);
                  } catch (error) {
                    console.error(`❌ [ADMIN] Ошибка при отправке уведомления студенту ${record.params.username}:`, error);
                    console.error(`❌ [ADMIN] Stack trace:`, error.stack);
                  }
                } else {
                  console.log(`ℹ️ [ADMIN] Нет данных о статусе оплаты в payload`);
                }
                
                console.log('✅ [ADMIN] Действие edit завершено');
                return response;
              },
            },
            // Действие для массового обновления статуса оплаты
            bulkUpdatePaymentStatus: {
              actionType: 'bulk',
              handler: async (request, response, context) => {
                const { records, resource } = context;
                const { status, notes } = request.payload;
                
                const updatedRecords = [];
                
                for (const record of records) {
                  const updatedRecord = await resource.update(record.id, {
                    'payment.status': status,
                    'payment.notes': notes || record.params.payment?.notes || '',
                    'payment.updatedAt': new Date()
                  });
                  
                  // Отправляем уведомление об изменении статуса оплаты
                  try {
                    const userId = record.params._id || record.params.id;
                    await sendPaymentNotification(userId, status);
                    console.log(`💰 Уведомление отправлено студенту ${record.params.username} (статус: ${status})`);
                  } catch (error) {
                    console.error(`❌ Ошибка при отправке уведомления студенту ${record.params.username}:`, error);
                  }
                  
                  updatedRecords.push(updatedRecord);
                }
                
                return {
                  records: updatedRecords.map(record => record.toJSON()),
                };
              },
              component: false,
              isVisible: (context) => context.resource.id() === 'StudentPayment',
            },
            // Действие для обновления статуса оплаты
            updatePaymentStatus: {
              actionType: 'record',
              handler: async (request, response, context) => {
                const { record, resource } = context;
                const { status, amount, paidAmount, dueDate, notes } = request.payload;
                
                const updateData = {
                  'payment.status': status,
                  'payment.updatedAt': new Date()
                };
                
                if (amount !== undefined) updateData['payment.amount'] = amount;
                if (paidAmount !== undefined) updateData['payment.paidAmount'] = paidAmount;
                if (dueDate !== undefined) updateData['payment.dueDate'] = dueDate;
                if (notes !== undefined) updateData['payment.notes'] = notes;
                
                // Если статус изменился на 'paid', обновляем дату последней оплаты
                if (status === 'paid') {
                  updateData['payment.lastPaymentDate'] = new Date();
                }
                
                const updatedRecord = await resource.update(record.id, updateData);
                
                // Отправляем уведомление об изменении статуса оплаты
                try {
                  const userId = record.params._id || record.params.id;
                  await sendPaymentNotification(userId, status);
                  console.log(`💰 Уведомление отправлено студенту ${record.params.username} (статус: ${status})`);
                } catch (error) {
                  console.error(`❌ Ошибка при отправке уведомления студенту ${record.params.username}:`, error);
                }
                
                return {
                  record: updatedRecord.toJSON(),
                };
              },
              component: false,
              isVisible: (context) => context.resource.id() === 'StudentPayment',
            },
            // Действие для экспорта данных об оплате
            exportPaymentData: {
              actionType: 'resource',
              handler: async (request, response, context) => {
                const { resource } = context;
                const students = await resource.find();
                
                // Формируем CSV данные
                const csvData = students.map(student => ({
                  'Имя пользователя': student.username,
                  'Имя': student.firstName || '',
                  'Фамилия': student.lastName || '',
                  'Email': student.email || '',
                  'Телефон': student.phone || '',
                  'Группа': student.group?.name || '',
                  'Статус оплаты': student.payment?.status || '',
                  'Сумма к оплате': student.payment?.amount || 0,
                  'Оплаченная сумма': student.payment?.paidAmount || 0,
                  'Дата оплаты': student.payment?.dueDate ? new Date(student.payment.dueDate).toLocaleDateString('ru-RU') : '',
                  'Комментарии': student.payment?.notes || '',
                  'Дата регистрации': student.createdAt ? new Date(student.createdAt).toLocaleDateString('ru-RU') : ''
                }));
                
                // Устанавливаем заголовки для скачивания CSV
                response.setHeader('Content-Type', 'text/csv; charset=utf-8');
                response.setHeader('Content-Disposition', 'attachment; filename=payment_data.csv');
                
                // Формируем CSV строку
                const headers = Object.keys(csvData[0]);
                const csvString = [
                  headers.join(','),
                  ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
                ].join('\n');
                
                response.send(csvString);
              },
              component: false,
              isVisible: (context) => context.resource.id() === 'StudentPayment',
            },
          },
        },
      },
      {
        resource: Subject,
        options: {
          navigation: { name: 'Learning Materials', icon: 'Book' },
          label: 'Subjects',
          listProperties: ['id', 'name', 'subtitle'],
          showProperties: ['id', 'name', 'subtitle', 'createdAt'],
          editProperties: ['name', 'subtitle'],
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
            id: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          actions: {
            new: {
              before: async (request) => {
                if (request.payload) {
                  const Subject = (await import('../models/subject.model.js'))
                    .default;
                  const last = await Subject.findOne().sort({ id: -1 });
                  const nextId = last && last.id ? last.id + 1 : 1;
                  request.payload.id = nextId;
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: Subsection,
        options: {
          navigation: { name: 'Learning Materials', icon: 'BookOpen' },
          label: 'Subsections',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
            id: { isVisible: false },
          },
          actions: {
            new: {
              before: async (request) => {
                if (request.payload) {
                  const Subsection = (
                    await import('../models/subsection.model.js')
                  ).default;
                  const last = await Subsection.findOne().sort({ id: -1 });
                  const nextId = last && last.id ? last.id + 1 : 1;
                  request.payload.id = nextId;
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: Topic,
        options: {
          navigation: { name: 'Learning Materials', icon: 'BookOpen' },
          label: 'Topics',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
            id: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            explanation: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          actions: {
            new: {
              before: async (request) => {
                if (request.payload) {
                  const Topic = (await import('../models/topic.model.js'))
                    .default;
                  const allTopics = await Topic.find({}, { id: 1 });
                  const numericIds = allTopics
                    .map((t) =>
                      typeof t.id === 'number' ? t.id : parseInt(t.id, 10)
                    )
                    .filter((id) => !isNaN(id));
                  const maxId =
                    numericIds.length > 0 ? Math.max(...numericIds) : 0;
                  const nextId = maxId + 1;
                  request.payload.id = nextId;

                  if (
                    typeof request.payload.explanation !== 'string' ||
                    request.payload.explanation.trim() === ''
                  ) {
                    const prompt = `Explain the school subject topic: "${request.payload.name}". Provide a detailed explanation with examples and practical applications.`;
                    try {
                      request.payload.explanation = await askHuggingFace(
                        prompt
                      );
                    } catch (e) {
                      request.payload.explanation =
                        'Error generating explanation';
                    }
                  }
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: OrtSample,
        options: {
          navigation: { name: 'Tests', icon: 'Clipboard' },
          label: 'Practice Tests',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
            file: { isVisible: false },
          },
        },
      },
      {
        resource: TestHistory,
        options: {
          navigation: { name: 'Tests', icon: 'List' },
          label: 'Test History',
          sort: {
            direction: 'desc',
            sortBy: 'date',
          },
          listProperties: [
            'user',
            'subject',
            'test',
            'date',
            'level',
            'resultPercent',
            'correct',
            'total',
          ],
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
            date: {
              isVisible: {
                list: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
        },
      },
      {
        resource: TestProgress,
        options: {
          navigation: { name: 'Tests', icon: 'Clock' },
          label: 'Test Progress',
          listProperties: [
            'user',
            'test',
            'status',
            'currentQuestionIndex',
            'timeLeft',
            'updatedAt',
          ],
          showProperties: [
            'user',
            'test',
            'status',
            'currentQuestionIndex',
            'timeLeft',
            'answers',
            'createdAt',
            'updatedAt',
          ],
          editProperties: [], // Make it read-only
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
            delete: { isAccessible: true },
          },
        },
      },
      {
        resource: AiQuestion,
        options: {
          navigation: { name: 'AI', icon: 'Sparkles' },
          label: 'AI Questions',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
          },
        },
      },
      {
        resource: Test,
        options: {
          navigation: { name: 'Tests', icon: 'Test' },
          properties: {
            _id: { isVisible: false },
            createdAt: {
              isVisible: {
                list: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            timeLimit: {
              isVisible: {
                list: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            questions: {
              isVisible: {
                list: false,
                show: true,
                edit: true,
                create: false,
              },
            },
            customTopicName: {
              isVisible: { list: true, show: true, edit: true, create: true },
              type: 'string',
              label: 'Пользовательская тема',
            },
            customTopicDescription: {
              isVisible: { list: false, show: true, edit: true, create: true },
              type: 'string',
              label: 'Описание пользовательской темы',
            },
          },
          actions: {
            new: {
              before: async (request) => {
                const { payload } = request;
                const {
                  difficulty,
                  topic: topicId,
                  questions,
                  title,
                } = payload;

                if (!difficulty || !topicId || !title) return request;

                const difficultySettings = {
                  начальный: { questions: 20, timeLimit: 1800 },
                  средний: { questions: 30, timeLimit: 2700 },
                  продвинутый: { questions: 40, timeLimit: 3600 },
                };
                const setting = difficultySettings[difficulty];

                if (!setting) return request;

                payload.timeLimit = setting.timeLimit;

                if (questions && questions.length > 0) return request;

                const topic = await Topic.findById(topicId);
                if (!topic) return request;

                const ortSample = await OrtSample.findOne({ topic: topicId });
                const ortSampleText =
                  ortSample && ortSample.content ? ortSample.content : '';
                const numQuestions = setting.questions;

                const prompt = `Внимание: отвечай только на русском языке.

Ты — опытный преподаватель, готовящий учеников к ОРТ (Общее Республиканское Тестирование) в Кыргызстане.

Вот учебный материал и примеры по теме "${topic.name}":
${ortSampleText}

Сгенерируй ${numQuestions} реалистичных тестовых вопросов по этой теме для уровня "${difficulty}".

Для каждого вопроса:
- Укажи текст вопроса.
- Дай 4 варианта ответа (A, B, C, D).
- Укажи правильный ответ (например: Ответ: B).
- Дай краткое объяснение (1-2 предложения), почему этот ответ верный или как решать.

Формат:
Вопрос 1. [текст]
A) [вариант A]
B) [вариант B]
C) [вариант C]
D) [вариант D]
Ответ: [A/B/C/D]
Объяснение: [краткое объяснение]

И так далее до ${numQuestions} вопросов. Не добавляй лишних пояснений.`;

                try {
                  const aiResponse = await askHuggingFace(prompt);
                  const questionsRaw = aiResponse
                    .split(/Вопрос \d+\./)
                    .filter(Boolean);

                  const parsedQuestions = questionsRaw
                    .map((q, idx) => {
                      const [mainPart, explanationPart] =
                        q.split('Объяснение:');
                      if (!mainPart) return null;

                      const [textAndOptions, answerLine] =
                        mainPart.split('Ответ:');
                      if (!textAndOptions || !answerLine) return null;

                      const [text, ...optionsRaw] = textAndOptions
                        .trim()
                        .split(/[A-D]\)/);
                      if (!text) return null;

                      const options = optionsRaw
                        .map((opt, i) => ({
                          optionId: String.fromCharCode(97 + i),
                          text: opt.trim(),
                        }))
                        .filter((o) => o.text);

                      const match = answerLine.match(/[A-D]/);
                      const correctOptionId = match
                        ? match[0].toLowerCase()
                        : null;

                      if (!correctOptionId || options.length < 4) return null;

                      return {
                        questionId: `q${idx + 1}`,
                        text: text.trim(),
                        options,
                        correctOptionId,
                        explanation: explanationPart
                          ? explanationPart.trim()
                          : '',
                      };
                    })
                    .filter(Boolean);

                  payload.questions = parsedQuestions.slice(0, numQuestions);
                } catch (e) {
                  console.error('Ошибка при генерации вопросов в AdminJS:', e);
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: Advice,
        options: {
          navigation: { name: 'Advice for users', icon: 'LightBulb' },
          label: 'Advice for users',
          properties: {
            _id: { isVisible: false },
            user: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
            },
            adviceText: {
              type: 'textarea',
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['user', 'adviceText', 'createdAt'],
        },
      },
      {
        resource: UserStatistics,
        options: {
          navigation: { name: 'User Statistics', icon: 'Chart' },
          label: 'User Statistics',
          properties: {
            _id: { isVisible: false },
            user: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
            },
            subjectStats: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'mixed',
            },
            weakTopics: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'mixed',
            },
            recommendations: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'mixed',
            },
            lastUpdated: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['user', 'lastUpdated'],
          showProperties: ['user', 'subjectStats', 'weakTopics', 'recommendations', 'lastUpdated'],
        },
      },
      {
        resource: Course,
        options: {
          navigation: { name: 'Education Platform', icon: 'Book' },
          label: 'Courses',
          properties: {
            _id: { isVisible: false },
            teacher: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'User',
              available: async () => {
                const User = mongoose.model('User');
                return User.find({ role: { $in: ['TEACHER', 'ADMIN'] } }).select('username profile.firstName profile.lastName');
              },
            },
            lessons: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'mixed',
            },
            duration: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },
            level: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },
            status: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },

            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            updatedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['name', 'teacher', 'level', 'status', 'duration', 'price', 'createdAt'],
          showProperties: ['name', 'description', 'teacher', 'level', 'status', 'duration', 'maxStudents', 'price', 'tags', 'coverImage', 'requirements', 'learningOutcomes', 'lessons', 'createdAt', 'updatedAt'],
          editProperties: ['name', 'description', 'teacher', 'level', 'status', 'duration', 'maxStudents', 'price', 'tags', 'coverImage', 'requirements', 'learningOutcomes'],
          createProperties: ['name', 'description', 'teacher', 'level', 'status', 'duration', 'maxStudents', 'price', 'tags', 'coverImage', 'requirements', 'learningOutcomes'],
        },
      },
      {
        resource: Group,
        options: {
          navigation: { name: 'Education Platform', icon: 'Users' },
          label: 'Groups',
          properties: {
            _id: { isVisible: false },
            teacher: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'User',
              available: async () => {
                const User = mongoose.model('User');
                return User.find({ role: { $in: ['TEACHER', 'ADMIN'] } }).select('username profile.firstName profile.lastName');
              },
            },
            students: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              type: 'mixed',
              reference: 'User',
              available: async () => {
                const User = mongoose.model('User');
                return User.find({ role: 'STUDENT' }).select('username profile.firstName profile.lastName');
              },
            },
            course: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'Course',
            },
            status: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },
            schedule: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
              type: 'mixed',
            },
            // meetingLink: {
            //   isVisible: {
            //     list: false,
            //     filter: false,
            //     show: true,
            //     edit: true,
            //     create: true,
            //   },
            // },
            // meetingPassword: {
            //   isVisible: {
            //     list: false,
            //     filter: false,
            //     show: true,
            //     edit: true,
            //     create: true,
            //   },
            // },
            // notes: {
            //   type: 'textarea',
            //   isVisible: {
            //     list: false,
            //     filter: false,
            //     show: true,
            //     edit: true,
            //     create: true,
            //   },
            // },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            updatedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['name', 'teacher', 'course', 'status', 'studentCount', 'maxStudents', 'createdAt'],
          showProperties: ['name', 'description', 'teacher', 'course', 'students', 'status', 'maxStudents', 'startDate', 'endDate', 'schedule', 'createdAt', 'updatedAt'],
          editProperties: ['name', 'description', 'teacher', 'course', 'students', 'status', 'maxStudents', 'startDate', 'endDate'],
        },
      },
      {
        resource: Lesson,
        options: {
          navigation: { name: 'Education Platform', icon: 'Video' },
          label: 'Lessons',
          properties: {
            _id: { isVisible: false },
            course: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Course',
            },
            group: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'Group',
            },
            videoUrl: {
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
            },

            materials: {
              type: 'mixed',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
            },
            'homework.description': {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              label: 'Описание домашнего задания',
            },
            'homework.dueDate': {
              type: 'date',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              label: 'Срок сдачи домашнего задания',
            },
            'homework.maxGrade': {
              type: 'number',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              label: 'Максимальная оценка',
              defaultValue: 100,
            },
            status: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },

            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            updatedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['title', 'course', 'group', 'status', 'createdAt'],
          showProperties: ['title', 'description', 'course', 'group', 'videoUrl', 'materials', 'homework.description', 'homework.dueDate', 'homework.maxGrade', 'status', 'createdAt', 'updatedAt'],
          editProperties: ['title', 'description', 'course', 'group', 'videoUrl', 'materials', 'homework.description', 'homework.dueDate', 'homework.maxGrade', 'status'],
          actions: {
            // Действие для создания домашних заданий для всех студентов группы
            createHomeworkForLesson: {
              actionType: 'record',
              handler: async (request, response, context) => {
                const { record, resource } = context;
                const { description, dueDate } = request.payload;
                
                try {
                  const Group = mongoose.model('Group');
                  const Homework = mongoose.model('Homework');
                  
                  const lesson = record.params;
                  const group = await Group.findById(lesson.group).populate('students');
                  
                  if (!group || !group.students || group.students.length === 0) {
                    throw new Error('Группа не найдена или в ней нет студентов');
                  }
                  
                  const createdHomework = [];
                  
                  // Создаем домашнее задание для каждого студента
                  for (const student of group.students) {
                    const homeworkData = {
                      student: student._id,
                      lesson: lesson._id,
                      course: group.course,
                      group: group._id,
                      text: description || lesson['homework.description'] || '',
                      dueDate: dueDate ? new Date(dueDate) : (lesson['homework.dueDate'] ? new Date(lesson['homework.dueDate']) : null),
                      status: 'draft'
                    };
                    
                    const homework = await Homework.create(homeworkData);
                    createdHomework.push(homework);
                  }
                  
                  return {
                    record: record.toJSON(),
                    notice: {
                      message: `Создано ${createdHomework.length} домашних заданий для группы ${group.name}`,
                      type: 'success'
                    }
                  };
                } catch (error) {
                  throw new Error(`Ошибка при создании домашних заданий: ${error.message}`);
                }
              },
              component: false,
              isVisible: (context) => context.resource.id() === 'Lesson',
            },
          },
        },
      },
      {
        resource: Homework,
        options: {
          navigation: { name: 'Education Platform', icon: 'Assignment' },
          label: 'Homework',
          properties: {
            _id: { isVisible: false },
            student: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'User',
              available: async () => {
                const User = mongoose.model('User');
                return User.find({ role: 'STUDENT' }).select('username profile.firstName profile.lastName');
              },
            },
            lesson: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Lesson',
            },
            course: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Course',
            },
            group: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Group',
            },
            files: {
              type: 'mixed',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
            },
            text: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
            },
            status: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },
            grade: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: false,
              },
            },
            teacherComment: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: false,
              },
            },
            gradedBy: {
              isVisible: {
                list: false,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            dueDate: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
            },
            isLate: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            submittedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            gradedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
            updatedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['student', 'lesson', 'course', 'group', 'status', 'grade', 'submittedAt', 'isLate'],
          showProperties: ['student', 'lesson', 'course', 'group', 'status', 'grade', 'teacherComment', 'files', 'text', 'dueDate', 'isLate', 'submittedAt', 'gradedAt', 'gradedBy', 'createdAt', 'updatedAt'],
          editProperties: ['student', 'lesson', 'course', 'group', 'status', 'grade', 'teacherComment', 'files', 'text', 'dueDate'],
          actions: {
            // Действие для массового создания домашних заданий для всех студентов группы
            createHomeworkForGroup: {
              actionType: 'resource',
              handler: async (request, response, context) => {
                const { resource } = context;
                const { lessonId, groupId, dueDate, description } = request.payload;
                
                try {
                  // Получаем всех студентов группы
                  const Group = mongoose.model('Group');
                  const group = await Group.findById(groupId).populate('students');
                  
                  if (!group || !group.students) {
                    throw new Error('Группа не найдена или в ней нет студентов');
                  }
                  
                  const createdHomework = [];
                  
                  // Создаем домашнее задание для каждого студента
                  for (const student of group.students) {
                    const homeworkData = {
                      student: student._id,
                      lesson: lessonId,
                      course: group.course,
                      group: groupId,
                      text: description || '',
                      dueDate: dueDate ? new Date(dueDate) : null,
                      status: 'draft'
                    };
                    
                    const homework = await resource.create(homeworkData);
                    createdHomework.push(homework);
                  }
                  
                  return {
                    records: createdHomework.map(hw => hw.toJSON()),
                    notice: {
                      message: `Создано ${createdHomework.length} домашних заданий для группы ${group.name}`,
                      type: 'success'
                    }
                  };
                } catch (error) {
                  throw new Error(`Ошибка при создании домашних заданий: ${error.message}`);
                }
              },
              component: false,
              isVisible: (context) => context.resource.id() === 'Homework',
            },
          },
        },
      },
      {
        resource: Schedule,
        options: {
          navigation: { name: 'Education Platform', icon: 'Calendar' },
          label: 'Schedule',
          properties: {
            _id: { isVisible: false },
            dateTime: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'datetime',
              label: 'Дата и время начала урока',
            },
            endTime: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'datetime',
              label: 'Дата и время окончания урока',
            },
            lesson: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'Lesson',
              label: 'Урок',
            },
            teacher: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              reference: 'User',
              label: 'Преподаватель',
            },
            group: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              reference: 'Group',
              label: 'Группа',
            },
            course: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              reference: 'Course',
              label: 'Курс',
            },
            format: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              availableValues: [
                { value: 'онлайн', label: 'Онлайн' },
                { value: 'оффлайн', label: 'Оффлайн' },
              ],
              label: 'Формат',
            },
            status: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              availableValues: [
                { value: 'запланирован', label: 'Запланирован' },
                { value: 'проведён', label: 'Проведён' },
                { value: 'перенесён', label: 'Перенесён' },
                { value: 'отменён', label: 'Отменён' },
              ],
              label: 'Статус',
            },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата создания',
            },
            updatedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата обновления',
            },
          },
          listProperties: ['dateTime', 'lesson', 'teacher', 'group', 'format', 'status'],
          showProperties: ['dateTime', 'endTime', 'lesson', 'teacher', 'group', 'course', 'format', 'status', 'createdAt', 'updatedAt'],
          editProperties: ['dateTime', 'lesson', 'status'],
          createProperties: ['dateTime', 'lesson', 'status'],
          actions: {
            new: {
              before: async (request) => {
                // Автоматически рассчитываем время окончания (1.5 часа по умолчанию)
                if (request.payload && request.payload.dateTime) {
                  const startTime = new Date(request.payload.dateTime);
                  const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // +1.5 часа
                  request.payload.endTime = endTime;
                }
                return request;
              },
            },
            edit: {
              before: async (request) => {
                // Автоматически рассчитываем время окончания при изменении времени начала
                if (request.payload && request.payload.dateTime) {
                  const startTime = new Date(request.payload.dateTime);
                  const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // +1.5 часа
                  request.payload.endTime = endTime;
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: Standup,
        options: {
          navigation: { name: 'Education Platform', icon: 'Presentation' },
          label: 'Standups',
          properties: {
            _id: { isVisible: false },
            student: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'User',
              available: async () => {
                const User = mongoose.model('User');
                return User.find({ role: 'STUDENT' }).select('username profile.firstName profile.lastName');
              },
            },
            lesson: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Lesson',
            },
            course: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Course',
            },
            group: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Group',
            },
            homework: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: true,
              },
              reference: 'Homework',
            },
            whatDone: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              label: 'Что сделано',
            },
            problems: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              label: 'Проблемы',
            },
            whatWillDo: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              label: 'Что буду делать',
            },
            status: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              availableValues: [
                { value: 'draft', label: 'Черновик' },
                { value: 'submitted', label: 'Отправлено' },
                { value: 'reviewed', label: 'Проверено' },
              ],
            },
            teacherComment: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: false,
              },
              label: 'Комментарий учителя',
            },
            reviewedBy: {
              isVisible: {
                list: false,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              reference: 'User',
              available: async () => {
                const User = mongoose.model('User');
                return User.find({ role: { $in: ['TEACHER', 'ADMIN'] } }).select('username profile.firstName profile.lastName');
              },
            },
            dueDate: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'date',
              label: 'Срок сдачи',
            },
            isLate: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              label: 'Сдано с опозданием',
            },
            submittedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата отправки',
            },
            reviewedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата проверки',
            },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата создания',
            },
            updatedAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
              type: 'date',
              label: 'Дата обновления',
            },
          },
          listProperties: ['student', 'lesson', 'course', 'group', 'homework', 'status', 'submittedAt', 'isLate'],
          showProperties: ['student', 'lesson', 'course', 'group', 'homework', 'whatDone', 'problems', 'whatWillDo', 'status', 'teacherComment', 'dueDate', 'isLate', 'submittedAt', 'reviewedAt', 'reviewedBy', 'createdAt', 'updatedAt'],
          editProperties: ['student', 'lesson', 'course', 'group', 'homework', 'whatDone', 'problems', 'whatWillDo', 'status', 'teacherComment', 'dueDate'],
          createProperties: ['student', 'lesson', 'course', 'group', 'homework', 'whatDone', 'problems', 'whatWillDo', 'status', 'dueDate'],
        },
      },
      {
        resource: Notification,
        options: {
          navigation: { name: 'Notifications', icon: 'Bell' },
          label: 'Notifications',
          properties: {
            _id: { isVisible: false },
            type: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              availableValues: [
                { value: 'new_lesson', label: '📚 Новое занятие' },
                { value: 'lesson_updated', label: '✏️ Изменение занятия' },
                { value: 'lesson_cancelled', label: '❌ Отмена занятия' },
                { value: 'lesson_status_changed', label: '🔄 Изменение статуса' },
                { value: 'homework_assigned', label: '📝 Домашнее задание' },
                { value: 'reminder', label: '⏰ Напоминание' },
                { value: 'payment_confirmed', label: '✅ Оплата подтверждена' },
                { value: 'payment_required', label: '💰 Требуется оплата' },
                { value: 'payment_reminder', label: '⏰ Напоминание об оплате' },
              ],
            },
            title: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
            },
            message: {
              type: 'textarea',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
            },
            lessonId: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'Schedule',
            },
            teacher: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'string',
            },
            date: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: true,
                create: true,
              },
              type: 'date',
            },
            recipients: {
              type: 'mixed',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: true,
                create: true,
              },
              reference: 'User',
            },
            metadata: {
              type: 'mixed',
              isVisible: {
                list: false,
                filter: false,
                show: true,
                edit: false,
                create: false,
              },
            },
            createdAt: {
              isVisible: {
                list: true,
                filter: true,
                show: true,
                edit: false,
                create: false,
              },
            },
          },
          listProperties: ['type', 'title', 'teacher', 'date', 'createdAt'],
          showProperties: ['type', 'title', 'message', 'lessonId', 'teacher', 'date', 'recipients', 'metadata', 'createdAt'],
          editProperties: ['type', 'title', 'message', 'lessonId', 'teacher', 'date', 'recipients'],
          filterProperties: ['type', 'teacher', 'date', 'createdAt'],
          sort: {
            direction: 'desc',
            sortBy: 'createdAt',
          },
          actions: {
            new: {
              before: async (request) => {
                if (request.payload && request.payload.recipients) {
                  // Преобразуем recipients в правильный формат
                  if (Array.isArray(request.payload.recipients)) {
                    request.payload.recipients = request.payload.recipients.map(userId => ({
                      userId,
                      read: false
                    }));
                  }
                }
                return request;
              },
            },
            edit: {
              before: async (request) => {
                if (request.payload && request.payload.recipients) {
                  // Преобразуем recipients в правильный формат
                  if (Array.isArray(request.payload.recipients)) {
                    request.payload.recipients = request.payload.recipients.map(userId => ({
                      userId,
                      read: false
                    }));
                  }
                }
                return request;
              },
            },
          },
        },
      },
    ],
    rootPath: '/admin',
    branding: {
      companyName: 'MathGenie',
      logo: false,
      softwareBrothers: false,
    },
  });

  return { adminJs, AdminJSExpress };
}

export { getAdminConfig };
