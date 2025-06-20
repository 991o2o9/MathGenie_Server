import Advice from '../models/advice.model.js';
import TestHistory, { TestAnswer } from '../models/testHistory.model.js';
import { getAdviceFromHuggingFace } from '../utils/huggingface.js';
import Subject from '../models/subject.model.js';
import Test from '../models/test.model.js';
import { formatDate } from '../utils/dateFormat.js';

// POST генерирует и сохраняет совет
export const generateAdvice = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // последние результаты теста
    const lastTest = await TestHistory.findOne({ user: userId }).sort({
      date: -1,
    });
    if (!lastTest) {
      return res
        .status(404)
        .json({ message: 'No test results found for user' });
    }

    // Получаем название предмета
    let subjectName = '';
    if (lastTest.subject) {
      const subject = await Subject.findById(lastTest.subject);
      subjectName = subject ? subject.name : '';
    }

    // Получаем сам тест по testId
    if (!lastTest.test) {
      return res.status(404).json({ message: 'Test ID not found in history' });
    }
    const test = await Test.findById(lastTest.test);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Получаем ответы пользователя на этот тест
    const answers = await TestAnswer.find({ user: userId, test: test._id });

    // Формируем подробный разбор по вопросам
    let questionsBlock = '';
    for (const q of test.questions) {
      const userAnswer = answers.find((a) => a.questionId === q.questionId);
      questionsBlock += `Вопрос: ${q.text}\n`;
      questionsBlock += `Правильный ответ: ${q.correctOptionId}\n`;
      if (userAnswer) {
        questionsBlock += `Ответ пользователя: ${
          userAnswer.selectedOptionId
        } (${userAnswer.isCorrect ? 'верно' : 'ошибка'})\n`;
      } else {
        questionsBlock += `Ответ пользователя: не отвечал\n`;
      }
      if (q.explanation) {
        questionsBlock += `Пояснение: ${q.explanation}\n`;
      }
      questionsBlock += '\n';
    }

    // Улчшенный промпт иее
    const prompt = `Пользователь прошёл тест по предмету: ${subjectName}, уровень сложности: ${lastTest.level}. Результат: ${lastTest.resultPercent}% (${lastTest.correct} из ${lastTest.total} правильных ответов).

Ниже приведён подробный разбор вопросов, включая ответы пользователя, правильные ответы и пояснения:

${questionsBlock}

На основе вышеуказанных данных, пожалуйста, сгенерируй развёрнутый и полезный текстовый совет, направленный на улучшение знаний пользователя. Ответ должен содержать следующие разделы:

1. Общая оценка результатов.
2. Ошибки и слабые темы.
3. Конкретные рекомендации по обучению (что почитать, на что обратить внимание, какие задания повторить).
4. Советы по стратегии прохождения теста (например, как правильно распределять время).
5. Мотивация и поддержка — чтобы пользователь не терял уверенность.

Стиль ответа: дружелюбный, поддерживающий, но профессиональный. Избегай использования эмодзи, markdown и изображений. Ответ должен быть написан строго на русском языке.`;

    // Получение совета от модели
    const adviceText = await getAdviceFromHuggingFace(prompt);

    // Сохраняем совет (обновляем, если уже есть для пользователя)
    const advice = await Advice.findOneAndUpdate(
      { user: userId },
      { adviceText, createdAt: new Date() },
      { new: true, upsert: true }
    );
    res.status(201).json(advice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /advice — получить последние советы пользователя
export const getAdvice = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const advices = await Advice.find({ user: userId }).sort({ createdAt: -1 });
    const formatted = advices.map((a) => ({
      _id: a._id,
      user: a.user,
      adviceText: a.adviceText,
      createdAt: formatDate(a.createdAt),
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
