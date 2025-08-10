import Notification from '../models/notification.model.js';
import { getUserNotifications, markNotificationAsRead } from '../utils/notifications.js';
import mongoose from 'mongoose';

/**
 * Получить уведомления пользователя с пагинацией
 * @param {Object} req - Express request object
 * @param {Object} req.user - Аутентифицированный пользователь
 * @param {string} req.user._id - ID пользователя
 * @param {Object} req.query - Query параметры
 * @param {string} req.query.limit - Количество уведомлений на странице (1-100, по умолчанию 20)
 * @param {string} req.query.skip - Количество уведомлений для пропуска (0+, по умолчанию 0)
 * @param {string} req.query.unreadOnly - Фильтр только непрочитанных уведомлений ('true'/'false')
 * @param {Object} res - Express response object
 */
export const getUserNotificationsController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    // Валидация параметров
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skipNum = Math.max(0, parseInt(skip) || 0);

    // Получаем уведомления с общим количеством
    const result = await getUserNotifications(userId, {
      limit: limitNum,
      skip: skipNum,
      unreadOnly: unreadOnly === 'true',
      withCount: true
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        limit: limitNum,
        skip: skipNum,
        total: result.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении уведомлений',
      error: error.message
    });
  }
};

/**
 * Отметить уведомление как прочитанное
 */
export const markNotificationAsReadController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const success = await markNotificationAsRead(id, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено или уже прочитано'
      });
    }

    res.json({
      success: true,
      message: 'Уведомление отмечено как прочитанное'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при отметке уведомления',
      error: error.message
    });
  }
};

/**
 * Получить количество непрочитанных уведомлений
 */
export const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      'recipients.userId': userId,
      'recipients.read': false
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении количества уведомлений',
      error: error.message
    });
  }
};

/**
 * Удалить уведомление для пользователя
 */
export const deleteNotificationController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Удаляем пользователя из списка получателей
    const result = await Notification.updateOne(
      { _id: id },
      { $pull: { recipients: { userId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено'
      });
    }

    // Если у уведомления больше нет получателей, удаляем его полностью
    const notification = await Notification.findById(id);
    if (notification && notification.recipients.length === 0) {
      await Notification.findByIdAndDelete(id);
    }

    res.json({
      success: true,
      message: 'Уведомление удалено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении уведомления',
      error: error.message
    });
  }
};

/**
 * Получить все уведомления с пагинацией (для администраторов)
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query параметры
 * @param {string} req.query.limit - Количество уведомлений на странице (1-200, по умолчанию 50)
 * @param {string} req.query.skip - Количество уведомлений для пропуска (0+, по умолчанию 0)
 * @param {string} req.query.type - Фильтр по типу уведомления
 * @param {string} req.query.teacher - Фильтр по учителю
 * @param {Object} res - Express response object
 */
export const getAllNotificationsController = async (req, res) => {
  try {
    const { limit = 50, skip = 0, type, teacher } = req.query;
    
    // Валидация параметров
    const limitNum = Math.max(1, Math.min(200, parseInt(limit) || 50));
    const skipNum = Math.max(0, parseInt(skip) || 0);
    
    const filter = {};
    if (type) filter.type = type;
    if (teacher) filter.teacher = teacher;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .populate('lessonId', 'title date startTime endTime')
      .populate('recipients.userId', 'username email role')
      .lean();

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        limit: limitNum,
        skip: skipNum,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении уведомлений',
      error: error.message
    });
  }
}; 

/**
 * Проверить и отправить уведомления неоплаченным студентам (для администраторов)
 */
export const checkAndNotifyUnpaidStudentsController = async (req, res) => {
  try {
    const { checkAndNotifyUnpaidStudents } = await import('../utils/notifications.js');
    
    const result = await checkAndNotifyUnpaidStudents();
    
    res.json({
      success: true,
      message: 'Проверка неоплаченных студентов завершена',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке неоплаченных студентов',
      error: error.message
    });
  }
};

/**
 * Проверить просроченные платежи (для администраторов)
 */
export const checkOverduePaymentsController = async (req, res) => {
  try {
    const { checkOverduePayments } = await import('../utils/notifications.js');
    
    const result = await checkOverduePayments();
    
    res.json({
      success: true,
      message: 'Проверка просроченных платежей завершена',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке просроченных платежей',
      error: error.message
    });
  }
};

/**
 * Отправить уведомление об оплате конкретному студенту (для администраторов)
 */
export const sendPaymentNotificationController = async (req, res) => {
  try {
    const { userId, paymentStatus } = req.body;
    const { sendPaymentNotification } = await import('../utils/notifications.js');
    
    if (!userId || !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать userId и paymentStatus'
      });
    }
    
    await sendPaymentNotification(userId, paymentStatus);
    
    res.json({
      success: true,
      message: 'Уведомление об оплате отправлено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при отправке уведомления об оплате',
      error: error.message
    });
  }
}; 

/**
 * Проверить студентов с неоплаченным статусом (для администраторов)
 */
export const checkUnpaidStudentsController = async (req, res) => {
  try {
    const User = mongoose.model('User');
    
    // Находим всех студентов
    const allStudents = await User.find({ role: 'STUDENT' })
      .select('_id username payment.status payment.dueDate payment.amount createdAt')
      .lean();

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

    // Находим студентов, требующих оплаты
    const unpaidStudents = studentsByStatus.unpaid.concat(studentsByStatus.overdue);

    res.json({
      success: true,
      data: {
        totalStudents: allStudents.length,
        studentsByStatus,
        unpaidStudents: unpaidStudents.length,
        studentsRequiringPayment: unpaidStudents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке студентов',
      error: error.message
    });
  }
}; 

/**
 * Тестирование уведомлений об оплате (для разработки, без аутентификации)
 */
export const testPaymentNotificationsController = async (req, res) => {
  try {
    const { sendPaymentRemindersToUnpaidStudents, checkOverduePayments } = await import('../utils/notifications.js');
    
    console.log('🧪 Тестирование системы уведомлений об оплате...');

    // 1. Проверяем и отправляем уведомления неоплаченным студентам
    console.log('1️⃣ Отправка уведомлений неоплаченным студентам...');
    const notificationsResult = await sendPaymentRemindersToUnpaidStudents();
    
    // 2. Проверяем просроченные платежи
    console.log('2️⃣ Проверка просроченных платежей...');
    const overdueResult = await checkOverduePayments();

    res.json({
      success: true,
      message: 'Тестирование уведомлений об оплате завершено',
      data: {
        notificationsSent: notificationsResult,
        overdueCheck: overdueResult
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при тестировании уведомлений:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при тестировании уведомлений',
      error: error.message
    });
  }
}; 