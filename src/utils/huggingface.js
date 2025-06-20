// Утилита для обращения к HuggingFace API
import { InferenceClient } from '@huggingface/inference';

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const MODEL = 'google/gemma-2-2b-it';

const client = new InferenceClient(HUGGINGFACE_TOKEN);

async function askHuggingFace(question) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: 'nebius',
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Ты русскоязычный помощник. Отвечай на русском языке, используя кириллицу. Английские термины допустимы, но основной текст должен быть на русском.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      parameters: {
        max_tokens: 500,
        temperature: 0.7,
      },
    });

    const response = chatCompletion.choices[0].message.content;

    const cyrillicCount = (response.match(/[а-яё]/gi) || []).length;
    const totalLetters = (response.match(/[а-яёa-z]/gi) || []).length;
    const cyrillicRatio = totalLetters > 0 ? cyrillicCount / totalLetters : 0;

    if (cyrillicRatio > 0.6) {
      console.log(
        `Получен ответ на русском языке (${(cyrillicRatio * 100).toFixed(
          1
        )}% кириллицы)`
      );
      return response;
    }

    console.log(
      'Первая попытка: мало русского текста, пробуем без системного промпта...'
    );

    const enhancedQuestion = `${question}

ВАЖНО: Отвечай на русском языке! Основной текст должен быть кириллицей.`;

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
        max_tokens: 500,
        temperature: 0.6,
      },
    });

    const secondResponse = secondAttempt.choices[0].message.content;
    const secondCyrillicCount = (secondResponse.match(/[а-яё]/gi) || []).length;
    const secondTotalLetters = (secondResponse.match(/[а-яёa-z]/gi) || [])
      .length;
    const secondCyrillicRatio =
      secondTotalLetters > 0 ? secondCyrillicCount / secondTotalLetters : 0;

    console.log(
      `Вторая попытка: ${(secondCyrillicRatio * 100).toFixed(1)}% кириллицы`
    );

    return secondCyrillicRatio > cyrillicRatio ? secondResponse : response;
  } catch (error) {
    console.error('Ошибка HuggingFace API:', error);
    throw error;
  }
}

export { askHuggingFace };
