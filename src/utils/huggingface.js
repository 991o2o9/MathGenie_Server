// Утилита для обращения к HuggingFace API
// ...

const { InferenceClient } = require('@huggingface/inference');

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const MODEL = 'google/gemma-2-2b-it';

const client = new InferenceClient(HUGGINGFACE_TOKEN);

async function askHuggingFace(question) {
  const chatCompletion = await client.chatCompletion({
    provider: 'nebius',
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: question,
      },
    ],
  });
  return chatCompletion.choices[0].message.content;
}

module.exports = { askHuggingFace };
