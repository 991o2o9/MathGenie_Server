import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Routes imports
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import aiQuestionRoutes from './routes/aiQuestion.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import subsectionRoutes from './routes/subsection.routes.js';
import topicRoutes from './routes/topic.routes.js';
import ortSampleRoutes from './routes/ortSample.routes.js';
import testHistoryRoutes from './routes/testHistory.routes.js';
import userRoutes from './routes/user.routes.js';

// Middleware imports
import authMiddleware from './middlewares/auth.middleware.js';
import roleMiddleware from './middlewares/role.middleware.js';

// Config imports
import { getAdminConfig } from './config/adminjs.js';
import swaggerSpec from './config/swagger.js';
import swaggerUi from 'swagger-ui-express';

// Models
import User from './models/user.model.js';
import { comparePassword } from './utils/bcrypt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/ai', aiQuestionRoutes);
app.use('/subjects', subjectRoutes);
app.use('/subsections', subsectionRoutes);
app.use('/topics', topicRoutes);
app.use('/ort-samples', ortSampleRoutes);
app.use('/test-history', testHistoryRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Пример защищённого эндпоинта
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Доступ разрешён', user: req.user });
});

/**
 * @swagger
 * /admin-only:
 *   get:
 *     summary: Только для ADMIN (JWT + роль)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Доступ разрешён только для ADMIN
 *       401:
 *         description: Нет или неверный токен
 *       403:
 *         description: Недостаточно прав
 */
app.get('/admin-only', authMiddleware, roleMiddleware('ADMIN'), (req, res) => {
  res.json({ message: 'Только для ADMIN', user: req.user });
});

// AdminJS
(async () => {
  const { adminJs, AdminJSExpress } = await getAdminConfig();
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        const user = await User.findOne({ username: email });
        if (user && user.role === 'ADMIN') {
          const isMatch = await comparePassword(password, user.password);
          if (isMatch) return user;
        }
        return false;
      },
      cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'admin_cookie_secret',
      cookieOptions: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        httpOnly: true,
      },
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
    }
  );
  app.use(adminJs.options.rootPath, adminRouter);
})();

// Swagger
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      authAction: {
        bearerAuth: {
          name: 'bearerAuth',
          schema: {
            type: 'http',
            in: 'header',
            name: 'Authorization',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          value: 'Bearer ',
        },
      },
      preauthorizeApiKey: {
        bearerAuth: '',
      },
    },
  })
);

app.use('/users', userRoutes);

// Список основных маршрутов API для фронта (HTML)
app.get('/api', (req, res) => {
  const routes = [
    {
      path: '/auth/login',
      method: 'POST',
      description: 'Вход пользователя (логин)',
    },
    {
      path: '/users',
      method: 'GET/POST',
      description: 'CRUD пользователей (ADMIN)',
    },
    { path: '/subjects', method: 'GET/POST', description: 'CRUD предметов' },
    {
      path: '/subsections',
      method: 'GET/POST',
      description: 'CRUD подразделов',
    },
    { path: '/topics', method: 'GET/POST', description: 'CRUD тем' },
    {
      path: '/ort-samples',
      method: 'GET/POST',
      description: 'CRUD пробников (файлы/текст)',
    },
    { path: '/test/pass', method: 'POST', description: 'Прохождение теста' },
    {
      path: '/test-history',
      method: 'GET/POST',
      description: 'История тестов пользователя',
    },
    { path: '/ai/ask', method: 'POST', description: 'Вопрос к ИИ' },
    {
      path: '/ai/top-questions',
      method: 'GET',
      description: 'Топ AI-вопросов',
    },
    { path: '/api/docs', method: 'GET', description: 'Swagger-документация' },
    { path: '/admin', method: 'GET', description: 'Админ-панель (AdminJS)' },
  ];
  res.send(`
    <html>
      <head>
        <title>MathBack API Routes</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; }
          h1 { color: #2d3a4b; }
          table { border-collapse: collapse; width: 80%; margin: 30px auto; background: #fff; box-shadow: 0 2px 8px #eee; }
          th, td { border: 1px solid #ddd; padding: 10px 16px; text-align: left; }
          th { background: #2d3a4b; color: #fff; }
          tr:nth-child(even) { background: #f2f2f2; }
          a { color: #2d3a4b; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1 style="text-align:center">MathBack API — Основные маршруты</h1>
        <table>
          <tr><th>Маршрут</th><th>Метод</th><th>Описание</th></tr>
          ${routes
            .map(
              (r) =>
                `<tr><td><a href="${r.path}">${r.path}</a></td><td>${r.method}</td><td>${r.description}</td></tr>`
            )
            .join('')}
        </table>
        <p style="text-align:center">Swagger: <a href="/api/docs">/api/docs</a> | Admin: <a href="/admin">/admin</a></p>
      </body>
    </html>
  `);
});

export default app;
