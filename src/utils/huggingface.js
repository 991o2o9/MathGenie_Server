// Утилита для обращения к HuggingFace API
import { InferenceClient } from '@huggingface/inference';

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const MODEL = 'google/gemma-2-9b-it';

const client = new InferenceClient(HUGGINGFACE_TOKEN);

async function askHuggingFace(question) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: 'nebius',
      model: MODEL,
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
      parameters: {
        max_tokens: 600,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.1,
      },
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

    const secondAttempt = await client.chatCompletion({
      provider: 'nebius',
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: enhancedQuestion,
        },
      ],
      parameters: {
        max_tokens: 600,
        temperature: 0.2,
        top_p: 0.8,
        repetition_penalty: 1.2,
      },
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
    console.error('❌ Ошибка HuggingFace API:', error);

    if (
      error.message.includes('Model not found') ||
      error.message.includes('unavailable')
    ) {
      console.log('🔄 Пробуем резервную модель...');
      return await fallbackToReserveModel(question);
    }

    throw error;
  }
}

async function fallbackToReserveModel(question) {
  try {
    const fallbackModel = 'google/gemma-2-2b-it';
    console.log(`🔄 Используем резервную модель: ${fallbackModel}`);

    const chatCompletion = await client.chatCompletion({
      provider: 'nebius',
      model: fallbackModel,
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
      parameters: {
        max_tokens: 500,
        temperature: 0.3,
      },
    });

    return chatCompletion.choices[0].message.content;
  } catch (fallbackError) {
    console.error('❌ Резервная модель также недоступна:', fallbackError);
    throw new Error('Все модели недоступны. Попробуйте позже.');
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

async function getAdviceFromHuggingFace(prompt) {
  const response = await askHuggingFace(prompt);

  // Валидация ответа
  const issues = validateResponse(response);
  if (issues.length > 0) {
    console.warn('⚠️ Обнаружены проблемы в ответе:', issues);
  }

  return response;
}

export { askHuggingFace, getAdviceFromHuggingFace, validateResponse };
