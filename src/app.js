import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import aiQuestionRoutes from './routes/aiQuestion.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import subsectionRoutes from './routes/subsection.routes.js';
import topicRoutes from './routes/topic.routes.js';
import ortSampleRoutes from './routes/ortSample.routes.js';
import testHistoryRoutes from './routes/testHistory.routes.js';
import userRoutes from './routes/user.routes.js';
import adviceRoutes from './routes/advice.routes.js';
import testProgressRoutes from './routes/testProgress.routes.js';

// Middleware
import authMiddleware from './middlewares/auth.middleware.js';
import roleMiddleware from './middlewares/role.middleware.js';

// Config
import { getAdminConfig } from './config/adminjs.js';
import swaggerSpec from './config/swagger.js';
import swaggerUi from 'swagger-ui-express';

// Models
import User from './models/user.model.js';
import { comparePassword } from './utils/bcrypt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

async function setupApp() {
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  app.use(cors());

  // Enhanced JSON parsing with error handling
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (e) {
          console.error('JSON parsing error:', e.message);
          res.status(400).json({
            message: 'Invalid JSON format',
            error:
              'The request body contains malformed JSON. Please check for unescaped characters like newlines, quotes, or special characters.',
            details: e.message,
          });
          throw new Error('JSON parsing failed');
        }
      },
    })
  );

  // Handle JSON parsing errors
  app.use((error, req, res, next) => {
    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      'body' in error
    ) {
      console.error('JSON parsing error:', error.message);
      return res.status(400).json({
        message: 'Invalid JSON format',
        error:
          'The request body contains malformed JSON. Please check for unescaped characters like newlines, quotes, or special characters.',
        details: error.message,
      });
    }
    next();
  });

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
  app.use('/api/advice', adviceRoutes);
  app.use('/test-progress', testProgressRoutes);

  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: 'Доступ разрешён', user: req.user });
  });

  app.get(
    '/admin-only',
    authMiddleware,
    roleMiddleware('ADMIN'),
    (req, res) => {
      res.json({ message: 'Только для ADMIN', user: req.user });
    }
  );

  // AdminJS
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

  // Simple test route
  app.get('/', (req, res) => {
    res.json({
      message: 'MathGenie API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Check MongoDB connection
      const dbState = mongoose.connection.readyState;
      const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus[dbState] || 'unknown',
        uptime: process.uptime(),
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  // Список основных маршрутов API для фронта (HTML)
  app.get('/api', (req, res) => {
    const routes = [
      { path: '/api/docs', method: 'GET', description: 'Swagger-документация' },
      { path: '/admin', method: 'GET', description: 'Админ-панель (AdminJS)' },
    ];

    res.send(`
      <html lang="ru">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>MathBack API Routes</title>
          <style>
            body {
              margin: 0;
              font-family: 'Segoe UI', sans-serif;
              background: #f4f7f9;
              color: #333;
            }
            header {
              background-color: #1e293b;
              padding: 20px;
              text-align: center;
              color: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 {
              margin: 0;
              font-size: 28px;
            }
            main {
              max-width: 1000px;
              margin: 40px auto;
              padding: 0 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background: #fff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            }
            th, td {
              padding: 14px 18px;
              text-align: left;
              border-bottom: 1px solid #eaeaea;
            }
            th {
              background-color: #0f172a;
              color: white;
              text-transform: uppercase;
              font-size: 14px;
              letter-spacing: 0.5px;
            }
            tr:hover {
              background-color: #f1f5f9;
            }
            a {
              color: #2563eb;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            footer {
              text-align: center;
              margin-top: 40px;
              color: #555;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <header>
            <h1>📘 MathGenie API — Основные маршруты</h1>
          </header>
          <main>
            <table>
              <thead>
                <tr>
                  <th>Маршрут</th>
                  <th>Метод</th>
                  <th>Описание</th>
                </tr>
              </thead>
              <tbody>
                ${routes
                  .map(
                    (r) =>
                      `<tr><td><a href="${r.path}">${r.path}</a></td><td>${r.method}</td><td>${r.description}</td></tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </main>
          <footer>
            Swagger: <a href="/api/docs">/api/docs</a> |
            Admin: <a href="/admin">/admin</a>
          </footer>
        </body>
      </html>
    `);
  });

  // Global error handler
  app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Something went wrong',
    });
  });

  // 404 handler for unmatched routes
  app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.method, req.originalUrl);
    res.status(404).json({
      message: 'Route not found',
      method: req.method,
      path: req.originalUrl,
    });
  });

  return app;
}

export default setupApp;
