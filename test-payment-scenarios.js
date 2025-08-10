import mongoose from 'mongoose';
import { 
  sendPaymentNotification, 
  checkOverduePayments, 
  sendPaymentRemindersToUnpaidStudents,
  checkAndNotifyUnpaidStudents 
} from './src/utils/notifications.js';
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

// Тестирование различных сценариев
const testPaymentScenarios = async () => {
  try {
    console.log('🧪 Тестирование различных сценариев уведомлений об оплате...\n');
    
    // 1. Тестирование отправки уведомления конкретному студенту
    console.log('1️⃣ Тестирование отправки уведомления конкретному студенту...');
    const student = await User.findOne({ username: 'test-student-payment' });
    if (student) {
      console.log(`   👤 Студент: ${student.username} (статус: ${student.payment?.status})`);
      
      // Отправляем уведомление о подтверждении оплаты
      await sendPaymentNotification(student._id, 'paid');
      console.log('   ✅ Уведомление о подтверждении оплаты отправлено');
      
      // Отправляем уведомление о необходимости оплаты
      await sendPaymentNotification(student._id, 'payment_required');
      console.log('   ✅ Уведомление о необходимости оплаты отправлено');
    }
    
    console.log('');
    
    // 2. Тестирование проверки просроченных платежей
    console.log('2️⃣ Тестирование проверки просроченных платежей...');
    const overdueResult = await checkOverduePayments();
    console.log('   📊 Результат проверки:', JSON.stringify(overdueResult, null, 2));
    
    console.log('');
    
    // 3. Тестирование массовой рассылки уведомлений
    console.log('3️⃣ Тестирование массовой рассылки уведомлений...');
    const bulkResult = await sendPaymentRemindersToUnpaidStudents();
    console.log(`   📢 Отправлено ${bulkResult} уведомлений`);
    
    console.log('');
    
    // 4. Тестирование комплексной проверки
    console.log('4️⃣ Тестирование комплексной проверки...');
    const comprehensiveResult = await checkAndNotifyUnpaidStudents();
    console.log('   🔍 Результат комплексной проверки:', JSON.stringify(comprehensiveResult, null, 2));
    
    console.log('');
    
    // 5. Проверка итогового состояния
    console.log('5️⃣ Проверка итогового состояния...');
    const finalStudents = await User.find({ role: 'STUDENT' })
      .select('username payment.status payment.amount payment.dueDate')
      .lean();
    
    console.log('   📊 Финальное состояние студентов:');
    finalStudents.forEach(student => {
      const status = student.payment?.status || 'noPayment';
      const amount = student.payment?.amount || 0;
      const dueDate = student.payment?.dueDate ? new Date(student.payment.dueDate).toLocaleDateString('ru-RU') : 'не указана';
      console.log(`      👤 ${student.username}: ${status} (${amount}₽, срок: ${dueDate})`);
    });
    
    // 6. Проверка созданных уведомлений
    console.log('\n6️⃣ Проверка созданных уведомлений...');
    const Notification = mongoose.model('Notification');
    const allNotifications = await Notification.find({}).sort({ createdAt: -1 }).lean();
    
    console.log(`   📧 Всего уведомлений: ${allNotifications.length}`);
    
    const paymentNotifications = allNotifications.filter(n => 
      n.type.includes('payment')
    );
    
    console.log(`   💰 Уведомлений об оплате: ${paymentNotifications.length}`);
    
    paymentNotifications.forEach((notification, index) => {
      const createdAt = new Date(notification.createdAt).toLocaleString('ru-RU');
      console.log(`      ${index + 1}. ${notification.title} (${notification.type}) - ${createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании сценариев:', error);
  }
};

// Основная функция
const main = async () => {
  try {
    await connectDB();
    await testPaymentScenarios();
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
