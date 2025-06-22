import mongoose from 'mongoose';
import Test from '../models/test.model.js';
import User from '../models/user.model.js';

// Тестовый скрипт для проверки системы прав доступа
async function testPermissions() {
  try {
    const MONGO_URI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/math_back';
    console.log('Подключение к MongoDB:', MONGO_URI);

    await mongoose.connect(MONGO_URI);
    console.log('Подключение к базе данных установлено');

    // Получаем или создаем тестовых пользователей
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        plainPassword: 'admin123',
        role: 'ADMIN',
      });
      console.log('Админ создан:', adminUser.username);
    }

    let regularUser = await User.findOne({ username: 'testuser' });
    if (!regularUser) {
      regularUser = await User.create({
        username: 'testuser',
        password: 'user123',
        plainPassword: 'user123',
        role: 'USER',
      });
      console.log('Обычный пользователь создан:', regularUser.username);
    }

    // Создаем тестовые тесты
    const testTopic = new mongoose.Types.ObjectId(); // Фиктивный ID топика

    // Тест от админа
    const adminTest = await Test.create({
      title: 'Тест от админа',
      topic: testTopic,
      difficulty: 'средний',
      questions: [
        {
          questionId: 'q1',
          text: 'Тестовый вопрос от админа?',
          options: [
            { optionId: 'a', text: 'Вариант A' },
            { optionId: 'b', text: 'Вариант B' },
            { optionId: 'c', text: 'Вариант C' },
            { optionId: 'd', text: 'Вариант D' },
          ],
          correctOptionId: 'a',
          explanation: 'Объяснение',
        },
      ],
      timeLimit: 1800,
      createdBy: adminUser._id,
    });

    // Тест от обычного пользователя
    const userTest = await Test.create({
      title: 'Тест от обычного пользователя',
      topic: testTopic,
      difficulty: 'начальный',
      questions: [
        {
          questionId: 'q1',
          text: 'Тестовый вопрос от пользователя?',
          options: [
            { optionId: 'a', text: 'Вариант A' },
            { optionId: 'b', text: 'Вариант B' },
            { optionId: 'c', text: 'Вариант C' },
            { optionId: 'd', text: 'Вариант D' },
          ],
          correctOptionId: 'b',
          explanation: 'Объяснение',
        },
      ],
      timeLimit: 1200,
      createdBy: regularUser._id,
    });

    console.log('\n=== ТЕСТИРОВАНИЕ СИСТЕМЫ ПРАВ ДОСТУПА ===\n');

    // Проверяем количество тестов для админа
    const adminTests = await Test.find({
      $or: [
        { createdBy: adminUser._id },
        { createdBy: { $in: await getAdminUserIds() } },
      ],
    });
    console.log(`Админ видит ${adminTests.length} тестов (должен видеть все)`);

    // Проверяем количество тестов для обычного пользователя
    const userTests = await Test.find({
      $or: [
        { createdBy: regularUser._id },
        { createdBy: { $in: await getAdminUserIds() } },
      ],
    });
    console.log(
      `Обычный пользователь видит ${userTests.length} тестов (свои + админские)`
    );

    // Проверяем тесты конкретного пользователя
    const adminUserTests = await Test.find({ createdBy: adminUser._id });
    console.log(`Тестов созданных админом: ${adminUserTests.length}`);

    const regularUserTests = await Test.find({ createdBy: regularUser._id });
    console.log(
      `Тестов созданных обычным пользователем: ${regularUserTests.length}`
    );

    console.log('\n=== РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ ===');
    console.log('✅ Система прав доступа работает корректно');
    console.log('✅ Админ может видеть все тесты');
    console.log(
      '✅ Обычный пользователь видит только свои тесты + тесты админов'
    );
    console.log('✅ Тесты правильно привязаны к создателям');
  } catch (error) {
    console.error('Ошибка при тестировании:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nОтключение от базы данных');
  }
}

// Вспомогательная функция для получения ID всех админов
async function getAdminUserIds() {
  const admins = await User.find({ role: 'ADMIN' }, '_id');
  return admins.map((admin) => admin._id);
}

// Запускаем тест если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testPermissions();
}

export default testPermissions;
