import mongoose from 'mongoose';
import { 
  sendPaymentNotification, 
  sendPaymentRemindersToUnpaidStudents, 
  checkAndNotifyUnpaidStudents,
  checkOverduePayments 
} from './notifications.js';
import User from '../models/user.model.js';
import '../config/db.js';

/**
 * Тестовый скрипт для демонстрации системы уведомлений об оплате
 */
async function testPaymentNotifications() {
  try {
    console.log('🧪 Тестирование системы уведомлений об оплате...\n');

    // Сначала найдем реальных студентов с неоплаченным статусом
    const unpaidStudents = await User.find({
      role: 'STUDENT',
      $or: [
        { 'payment.status': 'unpaid' },
        { 'payment.status': 'overdue' }
      ]
    }).select('_id username payment.status payment.dueDate payment.amount');

    console.log(`📊 Найдено ${unpaidStudents.length} студентов с неоплаченным статусом:`);
    unpaidStudents.forEach(student => {
      console.log(`   - ${student.username} (ID: ${student._id}, статус: ${student.payment?.status || 'unpaid'})`);
    });

    if (unpaidStudents.length === 0) {
      console.log('❌ Нет студентов с неоплаченным статусом для тестирования');
      return;
    }

    // Берем первого студента для тестирования
    const testStudent = unpaidStudents[0];
    console.log(`\n🎯 Тестируем на студенте: ${testStudent.username} (ID: ${testStudent._id})\n`);

    // 1. Тест отправки уведомления о необходимости оплаты
    console.log('1️⃣ Тест отправки уведомления о необходимости оплаты:');
    await sendPaymentNotification(testStudent._id, 'unpaid');
    console.log('   ✅ Уведомление о необходимости оплаты отправлено\n');

    // 2. Тест отправки уведомления о просроченной оплате
    console.log('2️⃣ Тест отправки уведомления о просроченной оплате:');
    await sendPaymentNotification(testStudent._id, 'overdue');
    console.log('   ✅ Уведомление о просроченной оплате отправлено\n');

    // 3. Тест массовой отправки уведомлений неоплаченным студентам
    console.log('3️⃣ Тест массовой отправки уведомлений неоплаченным студентам:');
    const result = await sendPaymentRemindersToUnpaidStudents();
    console.log(`   ✅ Отправлено ${result} уведомлений неоплаченным студентам\n`);

    // 4. Тест автоматической проверки просроченных платежей
    console.log('4️⃣ Тест автоматической проверки просроченных платежей:');
    const overdueResult = await checkOverduePayments();
    console.log('   ✅ Проверка просроченных платежей завершена:', overdueResult);

    // 5. Тест автоматической проверки
    console.log('5️⃣ Тест автоматической проверки:');
    const checkResult = await checkAndNotifyUnpaidStudents();
    console.log('   ✅ Автоматическая проверка завершена:', checkResult);

    console.log('\n🎉 Все тесты пройдены успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.connection.close();
    console.log('\n🔌 Соединение с базой данных закрыто');
  }
}

// Запускаем тест, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testPaymentNotifications();
}

export { testPaymentNotifications };
