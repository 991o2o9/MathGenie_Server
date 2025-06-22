import Advice from '../models/advice.model.js';
import TestHistory, { TestAnswer } from '../models/testHistory.model.js';
import { getAdviceFromHuggingFace } from '../utils/huggingface.js';
import Subject from '../models/subject.model.js';
import Test from '../models/test.model.js';
import { formatDate, formatDateISO } from '../utils/dateFormat.js';

// ** Эта функция будет вызываться после прохождения теста **
export const generateAndSaveAdviceForTest = async (
  userId,
  latestTestHistory
) => {
  try {
    if (!userId || !latestTestHistory) {
      console.error(
        'generateAndSaveAdviceForTest: Missing userId or latestTestHistory'
      );
      return;
    }

    // 1. Получаем историю последних 5 тестов для анализа динамики
    const allHistories = await TestHistory.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('subject'); // Загружаем предмет для получения названия

    let historySummaryBlock = '';
    if (allHistories && allHistories.length > 0) {
      historySummaryBlock = 'Вот краткая история последних результатов:\n\n';
      for (const history of allHistories) {
        const subjectName = history.subject
          ? history.subject.name
          : 'Неизвестный предмет';
        historySummaryBlock += `---
Предмет: "${subjectName}", Уровень: ${history.level}
Дата: ${formatDate(history.date)}
Результат: ${history.resultPercent}% (${history.correct} из ${
          history.total
        })\n`;
      }
      historySummaryBlock += '---\n\n';
    }

    // 2. Детально разбираем последний пройденный тест
    let detailedBlock = '';
    const populatedHistory = await TestHistory.findById(
      latestTestHistory._id
    ).populate('subject test');

    if (populatedHistory && populatedHistory.test) {
      const test = populatedHistory.test;
      const subjectName = populatedHistory.subject
        ? populatedHistory.subject.name
        : 'Неизвестный предмет';

      const answers = await TestAnswer.find({ user: userId, test: test._id });

      detailedBlock = `А вот детальный разбор самого последнего теста ("${test.title}"):\n\n`;
      for (const q of test.questions) {
        const userAnswer = answers.find((a) => a.questionId === q.questionId);
        detailedBlock += `Вопрос: ${q.text}\n`;
        detailedBlock += `Правильный ответ: ${q.correctOptionId}\n`;
        if (userAnswer) {
          detailedBlock += `Ответ пользователя: ${
            userAnswer.selectedOptionId
          } (${userAnswer.isCorrect ? 'верно' : 'ошибка'})\n`;
        } else {
          detailedBlock += `Ответ пользователя: не отвечал\n`;
        }
        if (q.explanation) {
          detailedBlock += `Пояснение: ${q.explanation}\n`;
        }
        detailedBlock += '\n';
      }
    }

    // 3. Собираем улучшенный, комплексный промпт
    const prompt = `Проанализируй успеваемость пользователя, чтобы дать ему комплексный и полезный совет.

${historySummaryBlock}
${detailedBlock}

На основе анализа этой информации (и общей динамики, и детальных ошибок в последнем тесте), пожалуйста, сгенерируй развёрнутый совет. Обрати внимание на тренды в результатах и на конкретные пробелы в знаниях, выявленные в последнем тесте.

Ответ должен содержать следующие разделы:

1. Общая оценка прогресса и динамики результатов (анализ истории).
2. Подробный разбор ошибок в последнем тесте и выявление слабых тем.
3. Конкретные рекомендации по обучению (что изучить, чтобы закрыть пробелы).
4. Советы по стратегии на будущее (как готовиться к следующим тестам).
5. Мотивация и поддержка, основанная на его общем прогрессе и результатах.

Стиль ответа: дружелюбный, поддерживающий, но профессиональный. Избегай использования эмодзи, markdown и изображений. Ответ должен быть написан строго на русском языке.`;

    // Получение совета от модели
    const adviceText = await getAdviceFromHuggingFace(prompt);

    // Сохраняем совет (обновляем, если уже есть для пользователя)
    await Advice.findOneAndUpdate(
      { user: userId },
      { adviceText, createdAt: new Date() },
      { new: true, upsert: true }
    );
    console.log(`Advice generated and saved for user ${userId}`);
  } catch (error) {
    console.error(`Error generating advice for user ${userId}:`, error);
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
