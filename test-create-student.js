import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import { hashPassword } from './src/utils/bcrypt.js';

// Подключение к базе данных
const connectDB = async () => {
  try {
    const MONGO_URI = 'mongodb+srv://admin:amin2007_@intertnershop1.l4yb3.mongodb.net/';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Подключение к базе данных установлено');
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    process.exit(1);
  }
};

// Создание тестового студента
const createTestStudent = async () => {
  try {
    // Проверяем, существует ли уже тестовый студент
    const existingStudent = await User.findOne({ username: 'test-student-payment' });
    
    if (existingStudent) {
      console.log('📝 Тестовый студент уже существует, обновляем статус оплаты...');
      
      // Обновляем статус на неоплаченный
      await User.findByIdAndUpdate(existingStudent._id, {
        'payment.status': 'unpaid',
        'payment.amount': 5000,
        'payment.dueDate': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через 7 дней
        'payment.updatedAt': new Date()
      });
      
      console.log('✅ Статус оплаты обновлен на "unpaid"');
      return existingStudent._id;
    }

    // Создаем нового тестового студента
    const hashedPassword = await hashPassword('test123');
    
    const testStudent = new User({
      username: 'test-student-payment',
      password: hashedPassword,
      plainPassword: 'test123',
      role: 'STUDENT',
      payment: {
        status: 'unpaid',
        amount: 5000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через 7 дней
        notes: 'Тестовый студент для проверки уведомлений об оплате'
      },
      profile: {
        firstName: 'Тест',
        lastName: 'Студент',
        email: 'test-payment@example.com'
      }
    });

    await testStudent.save();
    console.log('✅ Тестовый студент создан:', testStudent._id);
    return testStudent._id;
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестового студента:', error);
    throw error;
  }
};

// Создание студента с просроченной оплатой
const createOverdueStudent = async () => {
  try {
    // Проверяем, существует ли уже студент с просроченной оплатой
    const existingStudent = await User.findOne({ username: 'overdue-student' });
    
    if (existingStudent) {
      console.log('📝 Студент с просроченной оплатой уже существует, обновляем статус...');
      
      // Обновляем статус на просроченный
      await User.findByIdAndUpdate(existingStudent._id, {
        'payment.status': 'overdue',
        'payment.amount': 3000,
        'payment.dueDate': new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 дня назад
        'payment.updatedAt': new Date()
      });
      
      console.log('✅ Статус оплаты обновлен на "overdue"');
      return existingStudent._id;
    }

    // Создаем нового студента с просроченной оплатой
    const hashedPassword = await hashPassword('test123');
    
    const overdueStudent = new User({
      username: 'overdue-student',
      password: hashedPassword,
      plainPassword: 'test123',
      role: 'STUDENT',
      payment: {
        status: 'overdue',
        amount: 3000,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 дня назад
        notes: 'Студент с просроченной оплатой для тестирования'
      },
      profile: {
        firstName: 'Просроченный',
        lastName: 'Студент',
        email: 'overdue@example.com'
      }
    });

    await overdueStudent.save();
    console.log('✅ Студент с просроченной оплатой создан:', overdueStudent._id);
    return overdueStudent._id;
    
  } catch (error) {
    console.error('❌ Ошибка при создании студента с просроченной оплатой:', error);
    throw error;
  }
};

// Основная функция
const main = async () => {
  try {
    await connectDB();
    
    console.log('🧪 Создание тестовых студентов для проверки уведомлений об оплате...\n');
    
    // Создаем студента с неоплаченным статусом
    const unpaidStudentId = await createTestStudent();
    console.log(`   📚 Студент с неоплаченным статусом: ${unpaidStudentId}\n`);
    
    // Создаем студента с просроченной оплатой
    const overdueStudentId = await createOverdueStudent();
    console.log(`   ⚠️ Студент с просроченной оплатой: ${overdueStudentId}\n`);
    
    // Проверяем созданных студентов
    const allStudents = await User.find({ role: 'STUDENT' })
      .select('username payment.status payment.amount payment.dueDate')
      .lean();
    
    console.log('📊 Статистика студентов:');
    allStudents.forEach(student => {
      const status = student.payment?.status || 'noPayment';
      const amount = student.payment?.amount || 0;
      const dueDate = student.payment?.dueDate ? new Date(student.payment.dueDate).toLocaleDateString('ru-RU') : 'не указана';
      console.log(`   👤 ${student.username}: ${status} (${amount}₽, срок: ${dueDate})`);
    });
    
    console.log('\n✅ Тестовые студенты созданы успешно!');
    console.log('🚀 Теперь можно протестировать уведомления об оплате');
    
  } catch (error) {
    console.error('❌ Ошибка в основном процессе:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Соединение с базой данных закрыто');
    process.exit(0);
  }
};

// Запуск скрипта
main();
