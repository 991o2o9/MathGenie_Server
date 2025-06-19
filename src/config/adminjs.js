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
        },
      },
      {
        resource: Subsection,
        options: {
          navigation: { name: 'Учебные материалы', icon: 'BookOpen' },
          label: 'Подразделы',
        },
      },
      {
        resource: Topic,
        options: {
          navigation: { name: 'Учебные материалы', icon: 'BookOpen' },
          label: 'Темы',
        },
      },
      {
        resource: OrtSample,
        options: {
          navigation: { name: 'Пробники', icon: 'Document' },
          label: 'Пробники',
        },
      },
      {
        resource: TestHistory,
        options: {
          navigation: { name: 'Тесты', icon: 'List' },
          label: 'История тестов',
        },
      },
      {
        resource: AiQuestion,
        options: {
          navigation: { name: 'AI', icon: 'Bot' },
          label: 'AI-вопросы',
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
