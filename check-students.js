import mongoose from 'mongoose';
import User from './src/models/user.model.js';

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

// Проверка студентов
const checkStudents = async () => {
  try {
    console.log('🔍 Проверка студентов в базе данных...\n');
    
    // Все студенты
    const allStudents = await User.find({ role: 'STUDENT' }).lean();
    console.log(`📊 Всего студентов: ${allStudents.length}`);
    
    if (allStudents.length === 0) {
      console.log('❌ Студенты не найдены');
      return;
    }
    
    // Студенты с неоплаченным статусом
    const unpaidStudents = await User.find({
      role: 'STUDENT',
      $or: [
        { 'payment.status': 'unpaid' },
        { 'payment.status': 'overdue' }
      ]
    }).lean();
    
    console.log(`💰 Студентов, требующих оплаты: ${unpaidStudents.length}`);
    
    // Детальная информация о каждом студенте
    console.log('\n📋 Детальная информация о студентах:');
    allStudents.forEach((student, index) => {
      const paymentStatus = student.payment?.status || 'noPayment';
      const amount = student.payment?.amount || 0;
      const dueDate = student.payment?.dueDate ? new Date(student.payment.dueDate).toLocaleDateString('ru-RU') : 'не указана';
      const createdAt = new Date(student.createdAt).toLocaleDateString('ru-RU');
      
      console.log(`\n${index + 1}. 👤 ${student.username}`);
      console.log(`   ID: ${student._id}`);
      console.log(`   Статус оплаты: ${paymentStatus}`);
      console.log(`   Сумма: ${amount}₽`);
      console.log(`   Срок оплаты: ${dueDate}`);
      console.log(`   Создан: ${createdAt}`);
      
      if (student.payment) {
        console.log(`   Детали оплаты:`, JSON.stringify(student.payment, null, 2));
      }
    });
    
    // Проверка запроса для уведомлений
    console.log('\n🔍 Проверка запроса для уведомлений:');
    const query = {
      role: 'STUDENT',
      $or: [
        { 'payment.status': 'unpaid' },
        { 'payment.status': 'overdue' }
      ]
    };
    
    console.log('Запрос:', JSON.stringify(query, null, 2));
    
    const result = await User.find(query).select('_id username payment.status payment.dueDate payment.amount');
    console.log(`Результат запроса: ${result.length} студентов`);
    
    if (result.length > 0) {
      result.forEach(student => {
        console.log(`   - ${student.username}: ${student.payment?.status} (${student.payment?.amount}₽)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке студентов:', error);
  }
};

// Основная функция
const main = async () => {
  try {
    await connectDB();
    await checkStudents();
  } catch (error) {
    console.error('❌ Ошибка в основном процессе:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Соединение с базой данных закрыто');
    process.exit(0);
  }
};

// Запуск скрипта
main();
