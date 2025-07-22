import { Groq } from 'groq-sdk';

const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  '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';
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

async function askGroq(question) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты профессиональный русскоязычный образовательный помощник. 

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Отвечай ТОЛЬКО на русском языке
- Проверяй факты перед ответом
- Если не уверен в информации, честно скажи об этом
- Используй четкую структуру в ответах
- Избегай выдумывания несуществующих источников или фактов
- При объяснении математики используй простые и точные формулировки`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 8192,
      top_p: 0.9,
      stream: false,
    });

    const response = chatCompletion.choices[0].message.content;

    const cyrillicCount = (response.match(/[а-яё]/gi) || []).length;
    const totalLetters = (response.match(/[а-яёa-z]/gi) || []).length;
    const cyrillicRatio = totalLetters > 0 ? cyrillicCount / totalLetters : 0;

    const suspiciousPatterns = [
      /автор.*сталин/gi,
      /книга.*которой не существует/gi,
      /согласно исследованию.*\d{4}.*которое/gi,
    ];

    const hasSuspiciousContent = suspiciousPatterns.some((pattern) =>
      pattern.test(response)
    );

    if (hasSuspiciousContent) {
      console.warn('⚠️ Обнаружен потенциально недостоверный контент');
    }

    if (cyrillicRatio > 0.7) {
      console.log(
        `✅ Получен качественный ответ на русском языке (${(
          cyrillicRatio * 100
        ).toFixed(1)}% кириллицы)`
      );
      return response;
    }

    console.log(
      '🔄 Первая попытка: недостаточно русского текста, повторяем...'
    );

    const enhancedQuestion = `ВНИМАНИЕ: Отвечай строго на русском языке!

Вопрос: ${question}

Требования к ответу:
- Используй только кириллицу
- Проверь факты
- Будь точным и профессиональным
- Не выдумывай несуществующие источники`;

    const secondAttempt = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: enhancedQuestion,
        },
      ],
      model: MODEL,
      temperature: 0.2,
      max_tokens: 600,
      top_p: 0.8,
      stream: false,
    });

    const secondResponse = secondAttempt.choices[0].message.content;
    const secondCyrillicCount = (secondResponse.match(/[а-яё]/gi) || []).length;
    const secondTotalLetters = (secondResponse.match(/[а-яёa-z]/gi) || [])
      .length;
    const secondCyrillicRatio =
      secondTotalLetters > 0 ? secondCyrillicCount / secondTotalLetters : 0;

    console.log(
      `🔄 Вторая попытка: ${(secondCyrillicRatio * 100).toFixed(1)}% кириллицы`
    );

    return secondCyrillicRatio > cyrillicRatio ? secondResponse : response;
  } catch (error) {
    console.error('❌ Ошибка Groq API:', error);

    if (
      error.message.includes('Model not found') ||
      error.message.includes('unavailable') ||
      error.message.includes('rate limit')
    ) {
      console.log('🔄 Пробуем резервную модель...');
      return await fallbackToReserveModel(question);
    }

    throw error;
  }
}

async function fallbackToReserveModel(question) {
  try {
    console.log(`🔄 Используем резервную модель: ${FALLBACK_MODEL}`);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'Ты русскоязычный помощник. Отвечай точно и на русском языке.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      model: FALLBACK_MODEL,
      temperature: 0.3,
      max_tokens: 500,
      stream: false,
    });

    return chatCompletion.choices[0].message.content;
  } catch (fallbackError) {
    console.error('❌ Резервная модель также недоступна:', fallbackError);
    throw new Error('Все модели недоступны. Попробуйте позже.');
  }
}

// Функция для стриминга ответа (по вашему примеру)
async function askGroqStream(question) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ты профессиональный русскоязычный образовательный помощник. 

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Отвечай ТОЛЬКО на русском языке
- Проверяй факты перед ответом
- Если не уверен в информации, честно скажи об этом
- Используй четкую структуру в ответах
- Избегай выдумывания несуществующих источников или фактов
- При объяснении математики используй простые и точные формулировки`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 0.9,
      stream: true,
      stop: null,
    });

    let fullResponse = '';

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
      fullResponse += content;
    }

    return fullResponse;
  } catch (error) {
    console.error('❌ Ошибка Groq Stream API:', error);
    throw error;
  }
}

// Функция для проверки качества ответа
function validateResponse(response) {
  const issues = [];

  // Проверка на смесь языков
  const cyrillicCount = (response.match(/[а-яё]/gi) || []).length;
  const latinCount = (response.match(/[a-z]/gi) || []).length;

  if (latinCount > cyrillicCount) {
    issues.push('Слишком много английского текста');
  }

  // Проверка на подозрительные фразы
  const suspiciousPhrases = [
    'согласно моим знаниям',
    'я не могу найти информацию',
    'как ИИ помощник',
    'основываясь на моих данных',
  ];

  suspiciousPhrases.forEach((phrase) => {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push(`Использует фразу: "${phrase}"`);
    }
  });

  return issues;
}

async function getAdviceFromGroq(prompt) {
  const response = await askGroq(prompt);

  // Валидация ответа
  const issues = validateResponse(response);
  if (issues.length > 0) {
    console.warn('⚠️ Обнаружены проблемы в ответе:', issues);
  }

  return response;
}

// Алиас для обратной совместимости
const askHuggingFace = askGroq;
const getAdviceFromHuggingFace = getAdviceFromGroq;

export {
  askGroq,
  askGroqStream,
  getAdviceFromGroq,
  validateResponse,
  askHuggingFace,
  getAdviceFromHuggingFace,
};
