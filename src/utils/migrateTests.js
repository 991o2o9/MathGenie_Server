import mongoose from 'mongoose';
import Test from '../models/test.model.js';
import User from '../models/user.model.js';

// Функция для миграции существующих тестов
async function migrateTests() {
  try {
    // Подключаемся к базе данных
    const MONGO_URI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/math_back';
    console.log('Подключение к MongoDB:', MONGO_URI);

    await mongoose.connect(MONGO_URI);
    console.log('Подключение к базе данных установлено');

    // Получаем первого админа (или создаем его если нет)
    let adminUser = await User.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('Админ не найден, создаем первого админа...');
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        plainPassword: 'admin123',
        role: 'ADMIN',
      });
      console.log('Админ создан:', adminUser.username);
    } else {
      console.log('Админ найден:', adminUser.username);
    }

    // Находим все тесты без поля createdBy
    const testsWithoutCreator = await Test.find({
      createdBy: { $exists: false },
    });
    console.log(
      `Найдено ${testsWithoutCreator.length} тестов без поля createdBy`
    );

    if (testsWithoutCreator.length > 0) {
      // Обновляем все тесты, устанавливая createdBy как админа
      const result = await Test.updateMany(
        { createdBy: { $exists: false } },
        { createdBy: adminUser._id }
      );

      console.log(`Обновлено ${result.modifiedCount} тестов`);
    } else {
      console.log('Все тесты уже имеют поле createdBy');
    }

    // Проверяем результат
    const totalTests = await Test.countDocuments();
    const testsWithCreator = await Test.countDocuments({
      createdBy: { $exists: true },
    });

    console.log(`Всего тестов: ${totalTests}`);
    console.log(`Тестов с полем createdBy: ${testsWithCreator}`);

    console.log('Миграция завершена успешно');
  } catch (error) {
    console.error('Ошибка при миграции:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Отключение от базы данных');
  }
}

// Запускаем миграцию если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTests();
}

export default migrateTests;
