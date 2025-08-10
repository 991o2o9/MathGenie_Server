// Утилита для отправки уведомлений о изменениях в расписании
// В реальном проекте здесь будет интеграция с email, push-уведомлениями или WebSocket

import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';

/**
 * Форматирование даты для уведомлений
 */
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'сегодня';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'завтра';
  } else {
    return d.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      weekday: 'long'
    });
  }
};

/**
 * Форматирование времени для уведомлений
 */
const formatTime = (time) => {
  if (!time) return '';
  return time;
};

/**
 * Отправка уведомлений о изменениях в расписании
 * @param {string} type - Тип уведомления
 * @param {Object} lessonData - Данные занятия
 * @param {Array} recipients - Массив ID получателей (опционально)
 */
export const sendNotification = async (type, lessonData, recipients = []) => {
  try {
    const notificationTypes = {
      'new_lesson': {
        title: '📚 Новое занятие',
        message: `Добавлено новое занятие: "${lessonData.title}" ${formatDate(lessonData.date)} в ${formatTime(lessonData.startTime)}`
      },
      'lesson_updated': {
        title: '✏️ Изменение занятия',
        message: `Занятие "${lessonData.title}" было изменено. Проверьте обновленное расписание.`
      },
      'lesson_cancelled': {
        title: '❌ Отмена занятия',
        message: `Занятие "${lessonData.title}" отменено ${formatDate(lessonData.date)}`
      },
      'lesson_status_changed': {
        title: '🔄 Изменение статуса',
        message: `Статус занятия "${lessonData.title}" изменён на "${lessonData.statusText || lessonData.status}"`
      },
      'homework_assigned': {
        title: '📝 Домашнее задание',
        message: `По занятию "${lessonData.title}" назначено домашнее задание. Срок сдачи: ${formatDate(lessonData.homeworkDeadline)}`
      },
      'reminder': {
        title: '⏰ Напоминание',
        message: `Напоминание: завтра в ${formatTime(lessonData.startTime)} занятие "${lessonData.title}"`
      },
      'payment_required': {
        title: '💰 Требуется оплата',
        message: 'Для продолжения обучения необходимо внести оплату. Обратитесь к администратору.'
      },
      'payment_confirmed': {
        title: '✅ Оплата подтверждена',
        message: 'Ваша оплата подтверждена. Теперь вы можете участвовать во всех занятиях.'
      },
      'payment_reminder': {
        title: '⏰ Напоминание об оплате',
        message: 'Напоминаем о необходимости внести оплату для продолжения обучения. Обратитесь к администратору.'
      }
    };

    const notification = notificationTypes[type];
    if (!notification) {
      console.warn(`Неизвестный тип уведомления: ${type}`);
      return;
    }

    // Создаем запись уведомления в базе данных
    const notificationRecord = new Notification({
      type,
      title: notification.title,
      message: notification.message,
      lessonId: lessonData._id,
      teacher: lessonData.teacher,
      date: lessonData.date,
      recipients: recipients.map(userId => ({ userId })),
      metadata: {
        lessonTitle: lessonData.title,
        lessonDate: lessonData.date,
        lessonTime: lessonData.startTime,
        lessonFormat: lessonData.format,
        lessonStatus: lessonData.status
      }
    });

    await notificationRecord.save();

    // Логирование уведомления
    console.log('📧 Уведомление создано и сохранено:', {
      id: notificationRecord._id,
      type,
      title: notification.title,
      message: notification.message,
      lessonId: lessonData._id,
      recipientsCount: recipients.length,
      date: new Date().toISOString()
    });

    // Если есть получатели, отправляем персональные уведомления
    if (recipients.length > 0) {
      for (const recipientId of recipients) {
        await sendUserNotification(recipientId, notificationRecord);
      }
    }

    // TODO: Реализовать реальную отправку уведомлений
    // await sendEmailNotification(notificationRecord);
    // await sendPushNotification(notificationRecord);
    // await sendWebSocketNotification(notificationRecord);

    return notificationRecord;

  } catch (error) {
    console.error('Ошибка при отправке уведомления:', error);
    throw error;
  }
};

/**
 * Отправка уведомления конкретному пользователю
 * @param {string} userId - ID пользователя
 * @param {Object} notification - Данные уведомления
 */
export const sendUserNotification = async (userId, notification) => {
  try {
    // Логирование персонального уведомления
    console.log('👤 Персональное уведомление:', {
      userId,
      notificationId: notification._id,
      title: notification.title,
      message: notification.message,
      date: new Date().toISOString()
    });

    // TODO: Реализовать отправку персонального уведомления
    // await sendPersonalNotification(userId, notification);

  } catch (error) {
    console.error('Ошибка при отправке персонального уведомления:', error);
  }
};

/**
 * Массовая отправка уведомлений
 * @param {Array} userIds - Массив ID пользователей
 * @param {Object} notification - Данные уведомления
 */
export const sendBulkNotifications = async (userIds, notification) => {
  try {
    console.log(`📢 Массовая рассылка уведомлений для ${userIds.length} пользователей:`, {
      title: notification.title,
      message: notification.message,
      date: new Date().toISOString()
    });

    // TODO: Реализовать массовую рассылку
    // await sendBulkEmailNotifications(userIds, notification);
    // await sendBulkPushNotifications(userIds, notification);

  } catch (error) {
    console.error('Ошибка при массовой рассылке уведомлений:', error);
  }
};

/**
 * Получить уведомления для пользователя
 * @param {string} userId - ID пользователя
 * @param {Object} options - Опции (limit, skip, unreadOnly)
 */
/**
 * Получить уведомления пользователя с пагинацией
 * @param {string} userId - ID пользователя
 * @param {Object} options - Опции запроса
 * @param {number} options.limit - Количество уведомлений (по умолчанию 20)
 * @param {number} options.skip - Количество уведомлений для пропуска (по умолчанию 0)
 * @param {boolean} options.unreadOnly - Фильтр только непрочитанных уведомлений
 * @param {boolean} options.withCount - Возвращать ли общее количество уведомлений
 * @returns {Array|Object} Массив уведомлений или объект {notifications, total}
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false, withCount = false } = options;
    
    const query = {
      'recipients.userId': userId
    };
    
    if (unreadOnly) {
      query['recipients.read'] = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('lessonId', 'title date startTime endTime')
      .lean();

    if (withCount) {
      const total = await Notification.countDocuments(query);
      return { notifications, total };
    }

    return notifications;
  } catch (error) {
    console.error('Ошибка при получении уведомлений пользователя:', error);
    throw error;
  }
};

/**
 * Отметить уведомление как прочитанное
 * @param {string} notificationId - ID уведомления
 * @param {string} userId - ID пользователя
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const result = await Notification.updateOne(
      { 
        _id: notificationId,
        'recipients.userId': userId 
      },
      { 
        $set: { 
          'recipients.$.read': true,
          'recipients.$.readAt': new Date()
        } 
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Ошибка при отметке уведомления как прочитанного:', error);
    throw error;
  }
};

/**
 * Отправить напоминания о занятиях на завтра
 */
export const sendTomorrowReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    // Находим все занятия на завтра
    const Schedule = mongoose.model('Schedule');
    const tomorrowLessons = await Schedule.find({
      date: { $gte: tomorrow, $lt: nextDay },
      status: 'запланирован'
    }).lean();

    console.log(`📅 Найдено ${tomorrowLessons.length} занятий на завтра`);

    for (const lesson of tomorrowLessons) {
      // Отправляем напоминание о занятии
      await sendNotification('reminder', lesson);
    }

    return tomorrowLessons.length;
  } catch (error) {
    console.error('Ошибка при отправке напоминаний:', error);
    throw error;
  }
};

/**
 * Отправить уведомление об оплате студенту
 * @param {string} userId - ID студента
 * @param {boolean} isPaid - Статус оплаты
 */
export const sendPaymentNotification = async (userId, paymentStatus) => {
  console.log(`🔍 [NOTIFICATION] sendPaymentNotification вызвана`);
  console.log(`🔍 [NOTIFICATION] userId: ${userId}, paymentStatus: ${paymentStatus}`);
  
  try {
    const User = mongoose.model('User');
    console.log(`🔍 [NOTIFICATION] Ищем студента с ID: ${userId}`);
    const student = await User.findById(userId).exec();
    
    if (!student) {
      console.warn(`❌ [NOTIFICATION] Студент с ID ${userId} не найден`);
      return;
    }
    
    if (student.role !== 'STUDENT') {
      console.warn(`❌ [NOTIFICATION] Пользователь ${userId} не является студентом (роль: ${student.role})`);
      return;
    }
    
    console.log(`✅ [NOTIFICATION] Студент найден: ${student.username}`);

    const notificationTypes = {
      'payment_required': {
        title: '💰 Требуется оплата',
        message: 'Для продолжения обучения необходимо внести оплату. Обратитесь к администратору.'
      },
      'payment_confirmed': {
        title: '✅ Оплата подтверждена',
        message: 'Ваша оплата подтверждена. Теперь вы можете участвовать во всех занятиях.'
      },
      'payment_reminder': {
        title: '⏰ Напоминание об оплате',
        message: 'Напоминаем о необходимости внести оплату для продолжения обучения. Обратитесь к администратору.'
      }
    };

    let notificationType;
    
    switch (paymentStatus) {
      case 'paid':
        notificationType = 'payment_confirmed';
        break;
      case 'overdue':
        notificationType = 'payment_required';
        break;
      case 'pending':
        notificationType = 'payment_reminder';
        break;
      default:
        notificationType = 'payment_required';
    }

    console.log(`📝 [NOTIFICATION] Создаем уведомление типа: ${notificationType}`);
    console.log(`📝 [NOTIFICATION] Заголовок: ${notificationTypes[notificationType].title}`);
    console.log(`📝 [NOTIFICATION] Сообщение: ${notificationTypes[notificationType].message}`);
    
    // Создаем запись уведомления в базе данных
    const notificationRecord = new Notification({
      type: notificationType,
      title: notificationTypes[notificationType].title,
      message: notificationTypes[notificationType].message,
      lessonId: null, // Уведомления об оплате не связаны с занятиями
      teacher: 'Система', // Уведомления об оплате отправляются от системы
      date: new Date(),
      recipients: [{ userId }],
      metadata: {
        paymentStatus,
        studentId: student._id,
        studentName: student.username,
        dueDate: student.payment?.dueDate,
        amount: student.payment?.amount
      }
    });

    console.log(`💾 [NOTIFICATION] Сохраняем уведомление в базу данных...`);
    await notificationRecord.save();
    console.log(`✅ [NOTIFICATION] Уведомление сохранено с ID: ${notificationRecord._id}`);

    console.log(`💰 Уведомление об оплате отправлено студенту ${student.username}:`, {
      userId,
      paymentStatus,
      notificationType,
      date: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка при отправке уведомления об оплате:', error);
    throw error;
  }
};

/**
 * Отправить уведомления всем неоплаченным студентам
 */
export const sendPaymentRemindersToUnpaidStudents = async () => {
  try {
    const User = mongoose.model('User');
    const unpaidStudents = await User.find({
      role: 'STUDENT',
      $or: [
        { 'payment.status': 'unpaid' },
        { 'payment.status': 'overdue' }
      ]
    }).select('_id username payment.status payment.dueDate payment.amount');

    console.log(`💰 Найдено ${unpaidStudents.length} студентов, требующих оплаты`);

    let notificationsSent = 0;

    for (const student of unpaidStudents) {
      try {
        // Определяем тип уведомления в зависимости от статуса
        let notificationType = 'payment_reminder';
        
        if (student.payment?.status === 'overdue') {
          notificationType = 'payment_required';
        }

        const notificationTypes = {
          'payment_required': {
            title: '💰 Требуется оплата',
            message: 'Срок оплаты истек! Для продолжения обучения необходимо внести оплату в ближайшее время.'
          },
          'payment_reminder': {
            title: '⏰ Напоминание об оплате',
            message: 'Напоминаем о необходимости внести оплату для продолжения обучения. Обратитесь к администратору.'
          }
        };

        // Создаем запись уведомления в базе данных
        const notificationRecord = new Notification({
          type: notificationType,
          title: notificationTypes[notificationType].title,
          message: notificationTypes[notificationType].message,
          lessonId: null,
          teacher: 'Система',
          date: new Date(),
          recipients: [{ userId: student._id }],
          metadata: {
            paymentStatus: student.payment?.status,
            studentId: student._id,
            studentName: student.username,
            dueDate: student.payment?.dueDate,
            amount: student.payment?.amount
          }
        });

        await notificationRecord.save();
        notificationsSent++;
        
        console.log(`   ✅ Уведомление отправлено студенту ${student.username} (статус: ${student.payment?.status})`);
        
      } catch (error) {
        console.error(`   ❌ Ошибка при отправке уведомления студенту ${student.username}:`, error);
      }
    }

    console.log(`💰 Всего отправлено ${notificationsSent} уведомлений из ${unpaidStudents.length} найденных студентов`);
    return notificationsSent;
    
  } catch (error) {
    console.error('Ошибка при отправке напоминаний об оплате:', error);
    throw error;
  }
};

/**
 * Очистка старых уведомлений (старше 30 дней)
 */
export const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log(`🧹 Удалено ${result.deletedCount} старых уведомлений`);
    return result.deletedCount;
  } catch (error) {
    console.error('Ошибка при очистке старых уведомлений:', error);
    throw error;
  }
};

/**
 * Автоматическая проверка просроченных платежей
 * Обновляет статус студентов с просроченной оплатой
 */
export const checkOverduePayments = async () => {
  try {
    console.log('🔍 Проверка просроченных платежей...');
    
    const User = mongoose.model('User');
    const today = new Date();
    
    // Находим студентов с просроченной оплатой
    const overdueStudents = await User.find({
      role: 'STUDENT',
      'payment.status': 'unpaid',
      'payment.dueDate': { $lt: today }
    });

    console.log(`📅 Найдено ${overdueStudents.length} студентов с просроченной оплатой`);

    let updatedCount = 0;

    for (const student of overdueStudents) {
      try {
        // Обновляем статус на 'overdue'
        await User.findByIdAndUpdate(student._id, {
          'payment.status': 'overdue',
          'payment.updatedAt': new Date()
        });

        // Отправляем уведомление о просроченной оплате
        await sendPaymentNotification(student._id, 'overdue');
        
        updatedCount++;
        console.log(`   ⚠️ Статус обновлен для студента ${student.username}`);
        
      } catch (error) {
        console.error(`   ❌ Ошибка при обновлении статуса студента ${student.username}:`, error);
      }
    }

    console.log(`✅ Проверка завершена. Обновлено ${updatedCount} статусов`);
    
    return {
      success: true,
      overdueStudents: overdueStudents.length,
      updatedCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Ошибка при проверке просроченных платежей:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Автоматическая проверка и отправка уведомлений неоплаченным студентам
 * Эта функция может быть запущена по расписанию (например, раз в неделю)
 */
export const checkAndNotifyUnpaidStudents = async () => {
  try {
    console.log('🔍 Запуск автоматической проверки неоплаченных студентов...');
    
    const result = await sendPaymentRemindersToUnpaidStudents();
    
    console.log(`✅ Проверка завершена. Отправлено ${result} уведомлений о необходимости оплаты`);
    
    return {
      success: true,
      notificationsSent: result,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Ошибка при автоматической проверке неоплаченных студентов:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Экспортируем модель для использования в других частях приложения
// export { Notification }; 