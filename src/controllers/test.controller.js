// Контроллер для управления тестами

import Test from '../models/test.model.js';
import Topic from '../models/topic.model.js';
import OrtSample from '../models/ortSample.model.js';
import { v4 as uuidv4 } from 'uuid';
import { askHuggingFace } from '../utils/huggingface.js';
import TestHistory from '../models/testHistory.model.js';
import Subsection from '../models/subsection.model.js';

// Генерация теста по топику и сложности
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

// Получить тест по id (без правильных ответов)
async function getTest(req, res) {
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Тест не найден' });

  const questions = test.questions.map((q) => ({
    questionId: q.questionId,
    text: q.text,
    options: q.options,
  }));

  res.json({
    testId: test._id,
    title: test.title,
    questions,
    timeLimit: test.timeLimit,
  });
}

// Проверка теста
async function submitTest(req, res) {
  const { testId, answers } = req.body;

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
    if (userAnswer && userAnswer.selectedOptionId === q.correctOptionId) {
      score++;
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
        level,
        resultPercent,
        correct: score,
        total: test.questions.length,
      });
      historySaved = true;
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

export { generateTest, getTest, submitTest };
