// Контроллер для управления тестами

import Test from '../models/test.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import { askHuggingFace } from '../utils/huggingface.js';
import TestHistory from '../models/testHistory.model.js';
import { TestAnswer } from '../models/testHistory.model.js';
import TestProgress from '../models/testProgress.model.js';
import { generateAndSaveAdviceForTest } from './advice.controller.js';

// Конфигурация уровней сложности
const DIFFICULTY_SETTINGS = {
  начальный: {
    questions: 20,
    timeLimit: 1800,
    complexity: 'базовые понятия и простые задачи',
    keywords: ['основы', 'определение', 'простой', 'базовый'],
  },
  средний: {
    questions: 30,
    timeLimit: 2700,
    complexity: 'применение знаний и анализ',
    keywords: ['применение', 'анализ', 'сравнение', 'решение'],
  },
  продвинутый: {
    questions: 40,
    timeLimit: 3600,
    complexity: 'синтез, оценка и комплексные задачи',
    keywords: ['оценка', 'синтез', 'комплексный', 'критический анализ'],
  },
};

// Типы вопросов для разнообразия
const QUESTION_TYPES = [
  'определение понятий',
  'практическое применение',
  'анализ ситуации',
  'сравнение концепций',
  'решение задач',
  'логические выводы',
];

/**
 * Создает улучшенный промпт для генерации качественных тестовых вопросов
 */
function createEnhancedPrompt(
  topicName,
  topicDescription,
  ortSampleText,
  difficulty,
  numQuestions
) {
  const setting = DIFFICULTY_SETTINGS[difficulty];

  let prompt = `ИНСТРУКЦИЯ: Ты - эксперт по созданию качественных тестовых заданий для ОРТ в Кыргызстане. Отвечай ТОЛЬКО на русском языке.

ТЕМА: ${topicName}`;

  if (topicDescription) {
    prompt += `\nОПИСАНИЕ ТЕМЫ: ${topicDescription}`;
  }

  if (ortSampleText) {
    prompt += `\n\nУЧЕБНЫЙ МАТЕРИАЛ:\n${ortSampleText}`;
  }

  prompt += `\n\nТРЕБОВАНИЯ К ТЕСТУ:
- Уровень сложности: ${difficulty} (${setting.complexity})
- Количество вопросов: ${numQuestions}
- Фокус на: ${setting.keywords.join(', ')}

КРИТЕРИИ КАЧЕСТВА:
1. Каждый вопрос должен проверять конкретное знание или навык
2. Варианты ответов должны быть правдоподобными (избегать очевидно неправильных)
3. Вопросы должны быть разных типов: ${QUESTION_TYPES.slice(0, 3).join(', ')}
4. Формулировка должна быть четкой и однозначной
5. Избегать двусмысленности и "ловушек"

РАСПРЕДЕЛЕНИЕ ТИПОВ ВОПРОСОВ:
- ${Math.ceil(numQuestions * 0.3)} вопросов на знание фактов и определений
- ${Math.ceil(numQuestions * 0.4)} вопросов на понимание и применение
- ${Math.ceil(numQuestions * 0.3)} вопросов на анализ и синтез

ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА:
Вопрос 1. [Четкий и конкретный текст вопроса]
A) [Правдоподобный вариант ответа]
B) [Правдоподобный вариант ответа]
C) [Правдоподобный вариант ответа]
D) [Правдоподобный вариант ответа]
Ответ: [A/B/C/D]
Объяснение: [Подробное объяснение правильного ответа и почему другие варианты неверны]
Тип: [тип вопроса из списка выше]

ВАЖНО: 
- НЕ используй фразы типа "Какой из вариантов", "Выберите правильный" - формулируй вопрос прямо
- Каждый неправильный ответ должен быть обоснованно неверным, но не очевидно
- Объяснение должно содержать 2-3 предложения
- Генерируй ровно ${numQuestions} вопросов`;

  return prompt;
}

/**
 * Улучшенный парсер ответов от ИИ с валидацией
 */
function parseAIResponse(aiResponse, expectedQuestions) {
  const questionsRaw = aiResponse.split(/Вопрос \d+\./).filter(Boolean);
  const questions = [];

  for (let i = 0; i < questionsRaw.length; i++) {
    const questionText = questionsRaw[i];

    try {
      // Более надежное разделение частей
      const explanationMatch = questionText.match(
        /Объяснение:\s*(.+?)(?:\nТип:|$)/s
      );
      const typeMatch = questionText.match(/Тип:\s*(.+?)$/m);

      const beforeExplanation = questionText.split('Объяснение:')[0];
      const answerMatch = beforeExplanation.match(/Ответ:\s*([A-D])/);

      if (!answerMatch) continue;

      const beforeAnswer = beforeExplanation.split('Ответ:')[0];
      const lines = beforeAnswer
        .trim()
        .split('\n')
        .filter((line) => line.trim());

      if (lines.length < 5) continue; // Минимум: вопрос + 4 варианта

      const questionTextLine = lines[0].trim();
      const options = [];

      // Извлекаем варианты ответов
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/);
        if (optionMatch) {
          const [, letter, text] = optionMatch;
          options.push({
            optionId: letter.toLowerCase(),
            text: text.trim(),
          });
        }
      }

      if (options.length !== 4) continue; // Должно быть ровно 4 варианта

      const correctOptionId = answerMatch[1].toLowerCase();
      const explanation = explanationMatch ? explanationMatch[1].trim() : '';
      const questionType = typeMatch ? typeMatch[1].trim() : '';

      // Валидация качества вопроса
      if (isValidQuestion(questionTextLine, options, explanation)) {
        questions.push({
          questionId: `q${i + 1}`,
          text: questionTextLine,
          options: options,
          correctOptionId: correctOptionId,
          explanation: explanation,
          type: questionType,
        });
      }
    } catch (error) {
      console.warn(`Ошибка парсинга вопроса ${i + 1}:`, error.message);
      continue;
    }
  }

  return questions.slice(0, expectedQuestions);
}

/**
 * Валидация качества сгенерированного вопроса
 */
function isValidQuestion(questionText, options, explanation) {
  // Проверка минимальной длины
  if (questionText.length < 10) return false;
  if (explanation.length < 20) return false;

  // Проверка, что все варианты имеют достаточную длину
  if (options.some((opt) => opt.text.length < 3)) return false;

  // Проверка на отсутствие дублирования вариантов
  const optionTexts = options.map((opt) => opt.text.toLowerCase());
  if (new Set(optionTexts).size !== 4) return false;

  // Проверка на качество формулировки (избегаем слишком очевидные ответы)
  const hasObviousAnswer = options.some(
    (opt) =>
      opt.text.toLowerCase().includes('все вышеперечисленное') ||
      opt.text.toLowerCase().includes('ни один из вариантов') ||
      opt.text.toLowerCase().includes('неизвестно')
  );

  if (hasObviousAnswer) return false;

  return true;
}

/**
 * Повторная генерация вопросов при недостаточном качестве
 */
async function regenerateQuestions(
  originalPrompt,
  currentQuestions,
  targetCount,
  maxAttempts = 2
) {
  if (currentQuestions.length >= targetCount || maxAttempts <= 0) {
    return currentQuestions;
  }

  const needed = targetCount - currentQuestions.length;
  const regeneratePrompt =
    originalPrompt.replace(
      /Количество вопросов: \d+/,
      `Количество вопросов: ${needed}`
    ) +
    `\n\nВНИМАНИЕ: Предыдущая попытка дала недостаточно качественных вопросов. Улучши качество формулировок и вариантов ответов.`;

  try {
    const aiResponse = await askHuggingFace(regeneratePrompt);
    const newQuestions = parseAIResponse(aiResponse, needed);

    return [...currentQuestions, ...newQuestions];
  } catch (error) {
    console.warn('Ошибка при регенерации вопросов:', error.message);
    return currentQuestions;
  }
}

// Основная функция генерации теста с улучшениями
async function generateTest(req, res) {
  console.log('generateTest function called');
  console.log('Request body:', req.body);

  try {
    // Validate that req.body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
      console.log('Validation failed: invalid request body');
      return res.status(400).json({
        message: 'Invalid request body. Expected a JSON object.',
      });
    }

    const { topicId, difficulty, customTopicName, customTopicDescription } =
      req.body;

    console.log('Extracted parameters:', {
      topicId,
      difficulty,
      customTopicName,
      customTopicDescription,
    });

    // Sanitize and validate input
    const sanitizedTopicId = topicId ? String(topicId).trim() : null;
    const sanitizedDifficulty = difficulty ? String(difficulty).trim() : null;
    const sanitizedCustomTopicName = customTopicName
      ? String(customTopicName).trim()
      : null;
    const sanitizedCustomTopicDescription = customTopicDescription
      ? String(customTopicDescription).trim()
      : null;

    // Валидация входных данных
    if (
      (!sanitizedTopicId && !sanitizedCustomTopicName) ||
      !sanitizedDifficulty
    ) {
      console.log('Validation failed: missing required parameters');
      return res.status(400).json({
        message:
          'Нужно указать либо topicId, либо customTopicName, а также difficulty',
      });
    }

    if (!DIFFICULTY_SETTINGS[sanitizedDifficulty]) {
      console.log('Validation failed: invalid difficulty level');
      return res.status(400).json({
        message: `Недопустимый уровень сложности. Доступные: ${Object.keys(
          DIFFICULTY_SETTINGS
        ).join(', ')}`,
      });
    }

    console.log('Validation passed, proceeding with test generation...');

    let topic = null;
    let ortSampleText = '';
    let topicName = '';
    let topicDescription = '';

    // Получение данных о теме
    if (sanitizedTopicId) {
      topic = await Topic.findById(sanitizedTopicId);
      if (!topic) return res.status(404).json({ message: 'Топик не найден' });

      topicName = topic.name;
      const ortSample = await OrtSample.findOne({ topic: sanitizedTopicId });
      ortSampleText = ortSample?.content || '';
    } else {
      topicName = sanitizedCustomTopicName;
      topicDescription = sanitizedCustomTopicDescription || '';
    }

    const setting = DIFFICULTY_SETTINGS[sanitizedDifficulty];
    const numQuestions = setting.questions;
    const timeLimit = setting.timeLimit;

    // Создание улучшенного промпта
    const prompt = createEnhancedPrompt(
      topicName,
      topicDescription,
      ortSampleText,
      sanitizedDifficulty,
      numQuestions
    );

    // Генерация вопросов
    const aiResponse = await askHuggingFace(prompt);
    let questions = parseAIResponse(aiResponse, numQuestions);

    // Попытка регенерации при недостаточном количестве качественных вопросов
    if (questions.length < numQuestions * 0.8) {
      console.log(
        `Получено только ${questions.length} из ${numQuestions} вопросов. Попытка регенерации...`
      );
      questions = await regenerateQuestions(prompt, questions, numQuestions);
    }

    if (questions.length === 0) {
      return res.status(500).json({
        message:
          'Не удалось сгенерировать качественные вопросы. Попробуйте изменить параметры теста.',
      });
    }

    // === УНИКАЛИЗАЦИЯ questionId ===
    questions = questions.map((q, idx) => ({
      ...q,
      questionId: `q${idx + 1}`,
    }));
    // === КОНЕЦ УНИКАЛИЗАЦИИ ===

    // Сохранение теста
    const test = await Test.create({
      title: sanitizedTopicId
        ? `Тест по теме: ${topicName}`
        : `Тест: ${topicName}`,
      topic: topic?._id,
      customTopicName: !sanitizedTopicId ? topicName : undefined,
      customTopicDescription: !sanitizedTopicId ? topicDescription : undefined,
      difficulty: sanitizedDifficulty,
      questions: questions,
      timeLimit,
      createdBy: req.user._id,
    });

    // Подготовка ответа для пользователя (без правильных ответов)
    const questionsForUser = questions.map((q) => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options,
    }));

    res.status(201).json({
      testId: test._id,
      title: test.title,
      questions: questionsForUser,
      timeLimit: test.timeLimit,
      questionCount: questions.length,
      customTopicName: test.customTopicName,
      customTopicDescription: test.customTopicDescription,
    });
  } catch (error) {
    console.error('Ошибка генерации теста:', error);
    res.status(500).json({
      message: 'Ошибка генерации теста',
      error: error.message,
    });
  }
}

// Вспомогательная функция для получения ID всех админов
async function getAdminUserIds() {
  const User = (await import('../models/user.model.js')).default;
  const admins = await User.find({ role: 'ADMIN' }, '_id');
  return admins.map((admin) => admin._id);
}

// Получить все тесты с правами доступа
async function getAllTests(req, res) {
  try {
    let query = {};

    // Если пользователь не админ, показываем только тесты админов
    if (req.user.role !== 'ADMIN') {
      const adminIds = await getAdminUserIds();
      query = { createdBy: { $in: adminIds } };
    }

    const tests = await Test.find(
      query,
      'title difficulty questions timeLimit createdBy customTopicName'
    )
      .populate('topic', 'name')
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 });

    const formattedTests = tests.map((test) => ({
      testId: test._id,
      title: test.title,
      topic: test.topic,
      customTopicName: test.customTopicName,
      difficulty: test.difficulty,
      questionCount: test.questions.length,
      timeLimit: test.timeLimit,
      createdBy: {
        username: test.createdBy.username,
        role: test.createdBy.role,
      },
    }));

    res.json(formattedTests);
  } catch (error) {
    console.error('Ошибка при получении тестов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

// Получить тесты текущего пользователя
async function getUserTests(req, res) {
  try {
    const userId = req.user._id;

    const tests = await Test.find(
      { createdBy: userId },
      'title difficulty questions timeLimit customTopicName'
    )
      .populate('topic', 'name')
      .sort({ createdAt: -1 });

    const formattedTests = tests.map((test) => ({
      testId: test._id,
      title: test.title,
      topic: test.topic,
      customTopicName: test.customTopicName,
      difficulty: test.difficulty,
      questionCount: test.questions.length,
      timeLimit: test.timeLimit,
    }));

    res.json(formattedTests);
  } catch (error) {
    console.error('Ошибка при получении тестов пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

// Получить тест по id (без правильных ответов)
async function getTest(req, res) {
  try {
    const test = await Test.findById(req.params.id).populate(
      'createdBy',
      'username role'
    );

    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    // Проверяем права доступа
    if (
      req.user.role !== 'ADMIN' &&
      test.createdBy._id.toString() !== req.user._id.toString() &&
      test.createdBy.role !== 'ADMIN'
    ) {
      return res
        .status(403)
        .json({ message: 'Нет прав для просмотра этого теста' });
    }

    const questions = test.questions.map((q) => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options,
    }));

    res.json({
      testId: test._id,
      title: test.title,
      topic: test.topic,
      customTopicName: test.customTopicName,
      customTopicDescription: test.customTopicDescription,
      difficulty: test.difficulty,
      questions: questions,
      timeLimit: test.timeLimit,
      createdBy: {
        username: test.createdBy.username,
        role: test.createdBy.role,
      },
    });
  } catch (error) {
    console.error('Ошибка получения теста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

// Получить ответы и объяснения по ID теста
async function getTestAnswers(req, res) {
  try {
    const { testId } = req.params;

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const test = await Test.findById(testId).populate({
      path: 'topic',
      populate: {
        path: 'subsection',
        populate: { path: 'subject' },
      },
    });

    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    const userAnswers = await TestAnswer.find({
      user: req.user._id,
      test: testId,
    });

    const answersWithExplanations = test.questions.map((question) => {
      const userAnswer = userAnswers.find(
        (answer) => answer.questionId === question.questionId
      );

      return {
        questionId: question.questionId,
        questionText: question.text,
        options: question.options,
        correctOptionId: question.correctOptionId,
        selectedOptionId: userAnswer?.selectedOptionId || null,
        isCorrect: userAnswer?.isCorrect || false,
        explanation: question.explanation,
        type: question.type,
      };
    });

    res.json({
      testId: test._id,
      title: test.title,
      difficulty: test.difficulty,
      totalQuestions: test.questions.length,
      subject: test.topic?.subsection?.subject?.name || 'Тема',
      answers: answersWithExplanations,
    });
  } catch (error) {
    console.error('Ошибка получения ответов на тест:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

// Проверка теста с улучшенной аналитикой
async function submitTest(req, res) {
  try {
    const { testId, answers, durationSeconds } = req.body;
    const userId = req.user._id;

    // Валидация входных данных
    if (!testId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Некорректные данные теста' });
    }

    const test = await Test.findById(testId).populate({
      path: 'topic',
      populate: { path: 'subsection', populate: { path: 'subject' } },
    });

    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    let score = 0;
    const detailedAnswersForHistory = [];

    // Обработка ответов с улучшенной валидацией
    for (const question of test.questions) {
      const userAnswer = answers.find(
        (a) => a.questionId === question.questionId
      );
      const isCorrect =
        userAnswer && userAnswer.selectedOptionId === question.correctOptionId;

      if (isCorrect) score++;

      const answerRecord = {
        questionId: question.questionId,
        correctOptionId: question.correctOptionId,
        selectedOptionId: userAnswer?.selectedOptionId || 'none',
        explanation: question.explanation,
        type: question.type,
      };

      detailedAnswersForHistory.push(answerRecord);

      // Сохраняем детальную информацию об ответах
      if (userAnswer) {
        await TestAnswer.create({
          user: userId,
          test: testId,
          questionId: question.questionId,
          selectedOptionId: userAnswer.selectedOptionId,
          isCorrect: !!isCorrect,
        });
      }
    }

    // Сохранение истории теста
    let historySaved = false;
    let historyError = null;

    try {
      if (test.topic?.subsection?.subject) {
        const subjectId = test.topic.subsection.subject._id;
        const resultPercent = Math.round((score / test.questions.length) * 100);

        const newTestHistory = await TestHistory.create({
          user: userId,
          subject: subjectId,
          test: testId,
          level: test.difficulty,
          resultPercent,
          correct: score,
          total: test.questions.length,
          durationSeconds: durationSeconds || 0,
          answers: detailedAnswersForHistory,
        });

        historySaved = true;

        // Удаляем прогресс и генерируем советы
        await TestProgress.findOneAndDelete({ user: userId, test: testId });

        // Фоновая генерация советов
        generateAndSaveAdviceForTest(userId, newTestHistory).catch((err) =>
          console.error('Ошибка фоновой генерации совета:', err)
        );
      }
    } catch (err) {
      historyError = err.message || 'Ошибка сохранения истории теста';
      console.error('Ошибка сохранения истории теста:', err);
    }

    // Подготовка ответа с аналитикой
    const correctAnswersInfo = detailedAnswersForHistory.map(
      ({ questionId, correctOptionId, explanation, type }) => ({
        questionId,
        correctOptionId,
        explanation,
        type,
      })
    );

    res.json({
      score,
      total: test.questions.length,
      percentage: Math.round((score / test.questions.length) * 100),
      correctAnswers: correctAnswersInfo,
      historySaved,
      historyError,
      testCompleted: true,
    });
  } catch (error) {
    console.error('Ошибка при отправке теста:', error);
    res.status(500).json({
      message: 'Ошибка при обработке результатов теста',
      error: error.message,
    });
  }
}

export {
  generateTest,
  getTest,
  submitTest,
  getAllTests,
  getUserTests,
  getTestAnswers,
};
