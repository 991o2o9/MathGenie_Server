import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['new_lesson', 'lesson_updated', 'lesson_cancelled', 'lesson_status_changed', 'homework_assigned', 'reminder', 'payment_confirmed', 'payment_required', 'payment_reminder']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  teacher: String,
  date: {
    type: Date,
    required: true
  },
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индексы для оптимизации
notificationSchema.index({ 'recipients.userId': 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ lessonId: 1 });
notificationSchema.index({ createdAt: 1 });

// Виртуальное поле для количества непрочитанных уведомлений
notificationSchema.virtual('unreadCount').get(function() {
  return this.recipients.filter(recipient => !recipient.read).length;
});

// Виртуальное поле для проверки, прочитано ли уведомление конкретным пользователем
notificationSchema.methods.isReadByUser = function(userId) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId.toString());
  return recipient ? recipient.read : false;
};

// Метод для отметки уведомления как прочитанного
notificationSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId.toString());
  if (recipient) {
    recipient.read = true;
    recipient.readAt = new Date();
    return true;
  }
  return false;
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification; 