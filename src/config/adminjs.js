// Конфиг для AdminJS
// ...

import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Subsection from '../models/subsection.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import TestHistory from '../models/testHistory.model.js';
import AiQuestion from '../models/aiQuestion.model.js';
import { hashPassword } from '../utils/bcrypt.js';
import { askHuggingFace } from '../utils/huggingface.js';

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
    availableThemes: [dark, light, noSidebar],
    resources: [
      {
        resource: User,
        options: {
          navigation: { name: 'Пользователи', icon: 'User' },
          properties: {
            _id: { isVisible: false },
            password: {
              isVisible: {
                list: false,
                filter: false,
                show: false,
                edit: true,
                create: true,
              },
              type: 'password',
            },
            createdAt: { isVisible: false },
          },
          listProperties: ['username', 'role', 'createdAt'],
          label: 'Пользователи',
          actions: {
            new: {
              before: async (request) => {
                if (request.payload && request.payload.password) {
                  request.payload.password = await hashPassword(
                    request.payload.password
                  );
                }
                return request;
              },
            },
            edit: {
              before: async (request) => {
                if (request.payload && request.payload.password) {
                  request.payload.password = await hashPassword(
                    request.payload.password
                  );
                } else if (request.payload) {
                  // Если пароль не передан, не обновлять его
                  delete request.payload.password;
                }
                return request;
              },
            },
          },
        },
      },
      {
        resource: Subject,
        options: {
          navigation: { name: 'Учебные материалы', icon: 'Book' },
          label: 'Предметы',
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
          navigation: { name: 'Учебные материалы', icon: 'BookOpen' },
          label: 'Подразделы',
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
          navigation: { name: 'Учебные материалы', icon: 'BookOpen' },
          label: 'Темы',
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
                  // Получаем все id, фильтруем только числа
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

                  // Генерируем explanation, если оно не заполнено
                  if (
                    typeof request.payload.explanation !== 'string' ||
                    request.payload.explanation.trim() === ''
                  ) {
                    const prompt = `Объясни тему по школьному предмету: "${request.payload.name}". Дай подробное объяснение с примерами и практическими применениями.`;
                    try {
                      request.payload.explanation = await askHuggingFace(
                        prompt
                      );
                    } catch (e) {
                      request.payload.explanation =
                        'Ошибка генерации explanation';
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
          navigation: { name: 'Пробники', icon: 'Document' },
          label: 'Пробники',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
          },
        },
      },
      {
        resource: TestHistory,
        options: {
          navigation: { name: 'Тесты', icon: 'List' },
          label: 'История тестов',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
          },
        },
      },
      {
        resource: AiQuestion,
        options: {
          navigation: { name: 'AI', icon: 'Bot' },
          label: 'AI-вопросы',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
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
    locale: {
      language: 'ru',
      translations: {
        labels: {
          loginWelcome: 'Вход в админ-панель MathGenie',
        },
        messages: {
          loginWelcome: 'Вход в админ-панель MathGenie',
        },
        resources: {
          User: { name: 'Пользователь', name_plural: 'Пользователи' },
          Subject: { name: 'Предмет', name_plural: 'Предметы' },
          Subsection: { name: 'Подраздел', name_plural: 'Подразделы' },
          Topic: { name: 'Тема', name_plural: 'Темы' },
          OrtSample: { name: 'Пробник', name_plural: 'Пробники' },
          TestHistory: { name: 'История теста', name_plural: 'История тестов' },
          AiQuestion: { name: 'AI-вопрос', name_plural: 'AI-вопросы' },
        },
      },
    },
  });

  return { adminJs, AdminJSExpress };
}

export { getAdminConfig };
