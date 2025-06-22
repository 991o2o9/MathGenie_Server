// Контроллер для управления тестами

import Test from '../models/test.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import { v4 as uuidv4 } from 'uuid';
import { askHuggingFace } from '../utils/huggingface.js';
import TestHistory from '../models/testHistory.model.js';
import Subsection from '../models/subsection.model.js';
import { TestAnswer } from '../models/testHistory.model.js';
import TestProgress from '../models/testProgress.model.js';

async function generateTest(req, res) {
  const { topicId, difficulty } = req.body;
  if (!topicId || !difficulty) {
    return res
      .status(400)
      .json({ message: 'topicId и difficulty обязательны' });
  }

  const topic = await Topic.findById(topicId);
  if (!topic) return res.status(404).json({ message: 'Топик не найден' });

  // Получаем ort_sample для примера
  const ortSample = await OrtSample.findOne({ topic: topicId });
  const ortSampleText = ortSample && ortSample.content ? ortSample.content : '';

  // Сложности
  const difficultySettings = {
    начальный: { questions: 20, timeLimit: 1800 },
    средний: { questions: 30, timeLimit: 2700 },
    продвинутый: { questions: 40, timeLimit: 3600 },
  };

  const setting = difficultySettings[difficulty];
  if (!setting) {
    return res.status(400).json({ message: 'Недопустимый уровень сложности' });
  }

  const numQuestions = setting.questions;
  const timeLimit = setting.timeLimit;

  // prompt
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

  let aiResponse;
  try {
    aiResponse = await askHuggingFace(prompt);
  } catch (e) {
    return res.status(500).json({
      message: 'Ошибка генерации теста через HuggingFace',
      error: e.message,
    });
  }

  // Парсинг результата
  const questionsRaw = aiResponse.split(/Вопрос \d+\./).filter(Boolean);
  const questions = questionsRaw.map((q, idx) => {
    // Отделяем объяснение
    const [mainPart, explanationPart] = q.split('Объяснение:');
    const [textAndOptions, answerLine] = mainPart.split('Ответ:');
    const [text, ...optionsRaw] = textAndOptions.trim().split(/[A-D]\)/);
    const options = optionsRaw
      .map((opt, i) => ({
        optionId: String.fromCharCode(97 + i),
        text: opt.trim(),
      }))
      .filter((o) => o.text);
    const questionId = `q${idx + 1}`;
    let correctOptionId = null;
    if (answerLine) {
      const match = answerLine.match(/[A-D]/);
      if (match) {
        correctOptionId = match[0].toLowerCase();
      }
    }
    return {
      questionId,
      text: text.trim(),
      options,
      correctOptionId,
      explanation: explanationPart ? explanationPart.trim() : '',
    };
  });

  const filteredQuestions = questions.filter(
    (q) => q.options.length && q.correctOptionId
  );
  const selectedQuestions = filteredQuestions.slice(0, numQuestions);

  const test = await Test.create({
    title: `Тест по теме: ${topic.name}`,
    topic: topic._id,
    difficulty,
    questions: selectedQuestions,
    timeLimit,
    createdBy: req.user._id,
  });

  const questionsForUser = selectedQuestions.map((q) => ({
    questionId: q.questionId,
    text: q.text,
    options: q.options,
    explanation: q.explanation,
  }));

  res.status(201).json({
    testId: test._id,
    title: test.title,
    questions: questionsForUser,
    timeLimit: test.timeLimit,
  });
}

async function createTest(req, res) {
  const { title, topicId, difficulty, questions } = req.body;

  if (!topicId || !difficulty || !title) {
    return res
      .status(400)
      .json({ message: 'title, topicId и difficulty обязательны' });
  }

  const topic = await Topic.findById(topicId);
  if (!topic) return res.status(404).json({ message: 'Топик не найден' });

  // Сложности
  const difficultySettings = {
    начальный: { questions: 20, timeLimit: 1800 },
    средний: { questions: 30, timeLimit: 2700 },
    продвинутый: { questions: 40, timeLimit: 3600 },
  };

  const setting = difficultySettings[difficulty];
  if (!setting) {
    return res.status(400).json({ message: 'Недопустимый уровень сложности' });
  }
  const timeLimit = setting.timeLimit;
  let finalQuestions = questions;

  if (!finalQuestions || finalQuestions.length === 0) {
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

    let aiResponse;
    try {
      aiResponse = await askHuggingFace(prompt);
    } catch (e) {
      return res.status(500).json({
        message: 'Ошибка генерации теста через HuggingFace',
        error: e.message,
      });
    }

    const questionsRaw = aiResponse.split(/Вопрос \d+\./).filter(Boolean);
    const parsedQuestions = questionsRaw.map((q, idx) => {
      const [mainPart, explanationPart] = q.split('Объяснение:');
      const [textAndOptions, answerLine] = mainPart.split('Ответ:');
      const [text, ...optionsRaw] = textAndOptions.trim().split(/[A-D]\)/);
      const options = optionsRaw
        .map((opt, i) => ({
          optionId: String.fromCharCode(97 + i),
          text: opt.trim(),
        }))
        .filter((o) => o.text);
      const questionId = `q${idx + 1}`;
      let correctOptionId = null;
      if (answerLine) {
        const match = answerLine.match(/[A-D]/);
        if (match) {
          correctOptionId = match[0].toLowerCase();
        }
      }
      return {
        questionId,
        text: text.trim(),
        options,
        correctOptionId,
        explanation: explanationPart ? explanationPart.trim() : '',
      };
    });
    finalQuestions = parsedQuestions.filter(
      (q) => q.options.length && q.correctOptionId
    );
  }
  const test = await Test.create({
    title,
    topic: topic._id,
    difficulty,
    questions: finalQuestions,
    timeLimit,
    createdBy: req.user._id,
  });

  res.status(201).json(test);
}

async function getAllTests(req, res) {
  try {
    let query = {};

    // Если пользователь не админ, показываем только тесты админов и его собственные
    if (req.user.role !== 'ADMIN') {
      query = {
        $or: [
          { createdBy: { $in: await getAdminUserIds() } }, // Тесты админов
        ],
      };
    }

    const tests = await Test.find(
      query,
      'title difficulty questions timeLimit createdBy'
    )
      .populate('topic', 'name')
      .populate('createdBy', 'username role');

    const formattedTests = tests.map((test) => ({
      testId: test._id,
      title: test.title,
      topic: test.topic,
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

// Вспомогательная функция для получения ID всех админов
async function getAdminUserIds() {
  const User = (await import('../models/user.model.js')).default;
  const admins = await User.find({ role: 'ADMIN' }, '_id');
  return admins.map((admin) => admin._id);
}

// Получить тесты текущего пользователя
async function getUserTests(req, res) {
  try {
    const userId = req.user._id;

    const tests = await Test.find(
      { createdBy: userId },
      'title difficulty questions timeLimit'
    ).populate('topic', 'name');

    const formattedTests = tests.map((test) => ({
      testId: test._id,
      title: test.title,
      topic: test.topic,
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

// Получить тесты конкретного пользователя (только для админов)
async function getUserTestsByAdmin(req, res) {
  try {
    const userId = req.params.userId;

    // Проверяем, что пользователь существует
    const User = (await import('../models/user.model.js')).default;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const tests = await Test.find(
      { createdBy: userId },
      'title difficulty questions timeLimit'
    ).populate('topic', 'name');

    const formattedTests = tests.map((test) => ({
      testId: test._id,
      title: test.title,
      topic: test.topic,
      difficulty: test.difficulty,
      questionCount: test.questions.length,
      timeLimit: test.timeLimit,
    }));

    res.json(formattedTests);
  } catch (error) {
    console.error('Ошибка при получении тестов пользователя админом:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

// Получить тест по id (без правильных ответов)
async function getTest(req, res) {
  const test = await Test.findById(req.params.id).populate(
    'createdBy',
    'username role'
  );
  if (!test) return res.status(404).json({ message: 'Тест не найден' });

  // Проверяем права доступа
  if (
    req.user.role !== 'ADMIN' &&
    test.createdBy._id.toString() !== req.user._id.toString()
  ) {
    // Проверяем, является ли создатель теста админом
    if (test.createdBy.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'Нет прав для просмотра этого теста' });
    }
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
    difficulty: test.difficulty,
    questions: questions,
    timeLimit: test.timeLimit,
    createdBy: {
      username: test.createdBy.username,
      role: test.createdBy.role,
    },
  });
}

// Проверка теста
async function submitTest(req, res) {
  const { testId, answers } = req.body;
  const userId = req.user.id;

  // Получаем тест с заполнением topic
  const test = await Test.findById(testId).populate({
    path: 'topic',
    populate: {
      path: 'subsection',
      populate: {
        path: 'subject',
      },
    },
  });
  if (!test) return res.status(404).json({ message: 'Тест не найден' });

  let score = 0;
  const correctAnswers = test.questions.map((q) => {
    const userAnswer = answers.find((a) => a.questionId === q.questionId);
    const isCorrect =
      userAnswer && userAnswer.selectedOptionId === q.correctOptionId;
    if (isCorrect) {
      score++;
    }
    // Сохраняем ответ пользователя
    if (userAnswer) {
      TestAnswer.create({
        user: req.user._id,
        test: test._id,
        questionId: q.questionId,
        selectedOptionId: userAnswer.selectedOptionId,
        isCorrect: !!isCorrect,
      });
    }
    return {
      questionId: q.questionId,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
    };
  });

  let historySaved = false;
  let historyError = null;
  try {
    if (
      req.user &&
      test.topic &&
      test.topic.subsection &&
      test.topic.subsection.subject
    ) {
      const subjectId = test.topic.subsection.subject._id;
      const level = test.difficulty;
      const resultPercent = Math.round((score / test.questions.length) * 100);
      await TestHistory.create({
        user: req.user._id,
        subject: subjectId,
        test: test._id,
        level,
        resultPercent,
        correct: score,
        total: test.questions.length,
      });
      historySaved = true;

      // После успешной сдачи удаляем прогресс
      await TestProgress.findOneAndDelete({ user: userId, test: testId });
    } else {
      historyError =
        'Не удалось определить пользователя или subject для истории.';
      console.error('Ошибка сохранения истории теста:', historyError, {
        user: req.user,
        topic: test.topic,
      });
    }
  } catch (err) {
    historyError = err.message || 'Ошибка сохранения истории теста';
    console.error('Ошибка сохранения истории теста:', err);
  }

  res.json({
    score,
    total: test.questions.length,
    correctAnswers,
    historySaved,
    historyError,
  });
}

export {
  generateTest,
  getTest,
  submitTest,
  createTest,
  getAllTests,
  getUserTests,
  getUserTestsByAdmin,
};
