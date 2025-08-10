import mongoose from 'mongoose';
import User from '../models/user.model.js';

/**
 * Простой скрипт для проверки студентов с неоплаченным статусом
 */
async function checkStudents() {
  try {
    console.log('🔍 Провка студентов с неоплаченным статусом...\n');

    // Проверяем, подключена ли база данных
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ База данных не подключена. Убедитесь, что сервер запущен.');
      return;
    }

    console.log('✅ Подключение к базе данных установлено\n');

    // Находим всех студентов
    const allStudents = await User.find({ role: 'STUDENT' })
      .select('_id username payment.status payment.dueDate payment.amount createdAt')
      .lean();

    console.log(`📊 Всего студентов: ${allStudents.length}\n`);

    // Группируем по статусу оплаты
    const studentsByStatus = {
      unpaid: [],
      pending: [],
      paid: [],
      overdue: [],
      cancelled: [],
      noPayment: []
    };

    allStudents.forEach(student => {
      const status = student.payment?.status || 'noPayment';
      studentsByStatus[status].push(student);
    });

    // Выводим статистику
    Object.entries(studentsByStatus).forEach(([status, students]) => {
      if (students.length > 0) {
        console.log(`${status.toUpperCase()}: ${students.length} студентов`);
        students.forEach(student => {
          console.log(`   - ${student.username} (ID: ${student._id})`);
          if (student.payment?.amount) {
            console.log(`     Сумма: ${student.payment.amount}`);
          }
          if (student.payment?.dueDate) {
            console.log(`     Срок: ${new Date(student.payment.dueDate).toLocaleDateString()}`);
          }
        });
        console.log('');
      }
    });

    // Проверяем студентов с неоплаченным статусом
    const unpaidStudents = studentsByStatus.unpaid.concat(studentsByStatus.overdue);
    
    if (unpaidStudents.length > 0) {
      console.log(`💰 Студентов, требующих оплаты: ${unpaidStudents.length}`);
      console.log('Это те, кому должны приходить уведомления об оплате.\n');
    } else {
      console.log('✅ Все студенты оплачены или нет студентов с неоплаченным статусом.\n');
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке студентов:', error);
  } finally {
    console.log('🔍 Проверка завершена');
  }
}

// Запускаем проверку, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  checkStudents();
}

export { checkStudents };
