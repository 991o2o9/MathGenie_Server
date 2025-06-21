// Скрипт миграции для добавления поля plainPassword к существующим пользователям
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import 'dotenv/config';

async function migrateUsers() {
  try {
    console.log('Starting migration...');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI environment variable is not set');
      return;
    }

    // Подключение к базе данных
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Находим всех пользователей без поля plainPassword
    const users = await User.find({ plainPassword: { $exists: false } });
    console.log(`Found ${users.length} users to migrate`);

    if (users.length === 0) {
      console.log('No users need migration');
      return;
    }

    for (const user of users) {
      // Устанавливаем временный пароль для существующих пользователей
      // Админ сможет изменить его в админ панели
      user.plainPassword =
        'temp_password_' + Math.random().toString(36).substring(2, 8);
      await user.save();
      console.log(`Migrated user: ${user.username}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Запускаем миграцию если скрипт вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers();
}

export default migrateUsers;
