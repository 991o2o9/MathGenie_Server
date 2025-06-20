// AdminJS Config

import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Subsection from '../models/subsection.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import TestHistory from '../models/testHistory.model.js';
import AiQuestion from '../models/aiQuestion.model.js';
import Test from '../models/test.model.js';
import { hashPassword } from '../utils/bcrypt.js';
import { askHuggingFace } from '../utils/huggingface.js';
import Advice from '../models/advice.model.js';

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
          label: 'Users',
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
          navigation: { name: 'Learning Materials', icon: 'Book' },
          label: 'Subjects',
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
          navigation: { name: 'Practice Tests', icon: 'Document' },
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
          navigation: { name: 'Tests', icon: 'List' },
          label: 'Tests',
          properties: {
            _id: { isVisible: false },
            createdAt: { isVisible: false },
          },
        },
      },
      {
        resource: Advice,
        options: {
          navigation: { name: 'Users', icon: 'Idea' },
          label: 'Advice',
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
