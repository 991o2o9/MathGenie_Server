// AdminJS Config

import User from '../models/user.model.js';
import Subject from '../models/subject.model.js';
import Subsection from '../models/subsection.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import TestHistory from '../models/testHistory.model.js';
import AiQuestion from '../models/aiQuestion.model.js';
import Test from '../models/test.model.js';
import TestProgress from '../models/testProgress.model.js';
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
            id: { isVisible: false },
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
              type: 'string',
              isTitle: false,
            },
            createdAt: { isVisible: false },
          },
          listProperties: ['username', 'role', 'plainPassword', 'createdAt'],
          showProperties: ['username', 'role', 'plainPassword', 'createdAt'],
          editProperties: ['username', 'role', 'plainPassword'],
          filterProperties: ['username', 'role'],
          label: 'Users',
          actions: {
            new: {
              before: async (request) => {
                if (request.payload && request.payload.plainPassword) {
                  // Сохраняем исходный пароль
                  const originalPassword = request.payload.plainPassword;
                  // Хешируем пароль для поля password
                  request.payload.password = await hashPassword(
                    originalPassword
                  );
                }
                return request;
              },
            },
            edit: {
              before: async (request) => {
                if (request.payload && request.payload.plainPassword) {
                  // Сохраняем исходный пароль
                  const originalPassword = request.payload.plainPassword;
                  // Хешируем пароль для поля password
                  request.payload.password = await hashPassword(
                    originalPassword
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
