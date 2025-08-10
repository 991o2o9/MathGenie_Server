import mongoose from 'mongoose';
import Notification from './src/models/notification.model.js';
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

// Проверка уведомлений
const checkNotifications = async () => {
  try {
    console.log('🔍 Проверка уведомлений в базе данных...\n');
    
    // Все уведомления
    const allNotifications = await Notification.find({}).lean();
    console.log(`📧 Всего уведомлений: ${allNotifications.length}`);
    
    if (allNotifications.length === 0) {
      console.log('❌ Уведомления не найдены');
      return;
    }
    
    // Уведомления об оплате
    const paymentNotifications = await Notification.find({
      type: { $in: ['payment_required', 'payment_reminder', 'payment_confirmed'] }
    }).lean();
    
    console.log(`💰 Уведомлений об оплате: ${paymentNotifications.length}`);
    
    // Детальная информация о каждом уведомлении
    console.log('\n📋 Детальная информация об уведомлениях:');
    allNotifications.forEach((notification, index) => {
      const createdAt = new Date(notification.createdAt).toLocaleString('ru-RU');
      const recipientsCount = notification.recipients?.length || 0;
      
      console.log(`\n${index + 1}. 📧 ${notification.title}`);
      console.log(`   ID: ${notification._id}`);
      console.log(`   Тип: ${notification.type}`);
      console.log(`   Сообщение: ${notification.message}`);
      console.log(`   Получатели: ${recipientsCount}`);
      console.log(`   Создано: ${createdAt}`);
      
      if (notification.recipients && notification.recipients.length > 0) {
        console.log(`   Детали получателей:`);
        notification.recipients.forEach((recipient, rIndex) => {
          console.log(`     ${rIndex + 1}. ID: ${recipient.userId}, Прочитано: ${recipient.read || false}`);
        });
      }
      
      if (notification.metadata) {
        console.log(`   Метаданные:`, JSON.stringify(notification.metadata, null, 2));
      }
    });
    
    // Проверка уведомлений для конкретных студентов
    console.log('\n👥 Проверка уведомлений для студентов:');
    
    const students = await User.find({ role: 'STUDENT' }).select('_id username payment.status');
    
    for (const student of students) {
      const studentNotifications = await Notification.find({
        'recipients.userId': student._id
      }).lean();
      
      console.log(`\n👤 ${student.username} (${student.payment?.status || 'noPayment'}):`);
      console.log(`   Уведомлений: ${studentNotifications.length}`);
      
      if (studentNotifications.length > 0) {
        studentNotifications.forEach((notification, index) => {
          console.log(`   ${index + 1}. ${notification.title} - ${notification.type}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке уведомлений:', error);
  }
};

// Основная функция
const main = async () => {
  try {
    await connectDB();
    await checkNotifications();
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
