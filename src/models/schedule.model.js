import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  // Основная информация о занятии
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  }, // Формат "HH:MM"
  endTime: { 
    type: String, 
    required: true 
  }, // Формат "HH:MM"
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  
  // Формат и статус
  format: { 
    type: String, 
    enum: ['онлайн', 'оффлайн', 'запись'], 
    default: 'онлайн' 
  },
  status: { 
    type: String, 
    enum: ['запланирован', 'проведён', 'перенесён', 'отменён'], 
    default: 'запланирован' 
  },
  
  // Преподаватель и материалы
  teacher: { 
    type: String, 
    required: true 
  },
  materials: [{ 
    type: String 
  }], // Простые ссылки на материалы
  streamLink: { 
    type: String 
  },
  
  // Домашнее задание
  homework: { 
    type: String 
  },
  homeworkDeadline: { 
    type: Date 
  },
  
  // Временные метки
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Обновление времени изменения
scheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Виртуальное поле для полной даты и времени
scheduleSchema.virtual('fullDateTime').get(function() {
  const date = this.date.toISOString().split('T')[0];
  return `${date} ${this.startTime}`;
});

// Виртуальное поле для статуса на русском
scheduleSchema.virtual('statusText').get(function() {
  const statusMap = {
    'запланирован': 'Запланирован',
    'проведён': 'Проведён',
    'перенесён': 'Перенесён',
    'отменён': 'Отменён'
  };
  return statusMap[this.status] || this.status;
});

// Виртуальное поле для формата на русском
scheduleSchema.virtual('formatText').get(function() {
  const formatMap = {
    'онлайн': 'Онлайн',
    'оффлайн': 'Оффлайн',
    'запись': 'Запись'
  };
  return formatMap[this.format] || this.format;
});

// Индексы для оптимизации
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ format: 1 });
scheduleSchema.index({ teacher: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule; 