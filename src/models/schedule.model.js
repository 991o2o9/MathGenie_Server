import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  // Основная информация о занятии
  dateTime: { 
    type: Date, 
    required: true 
  }, // Дата и время начала урока
  endTime: { 
    type: Date, 
    required: true 
  }, // Дата и время окончания урока (автоматически рассчитывается)
  
  // Связь с уроком (основная)
  lesson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson', 
    required: true 
  },
  
  // Автоматически заполняемые поля
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Автоматически из урока
  group: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group' 
  }, // Автоматически из урока
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }, // Автоматически из урока
  
  // Формат занятия (автоматически из группы)
  format: { 
    type: String, 
    enum: ['онлайн', 'оффлайн'], 
    default: 'онлайн' 
  },
  
  // Статус занятия
  status: { 
    type: String, 
    enum: ['запланирован', 'проведён', 'перенесён', 'отменён'], 
    default: 'запланирован' 
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

// Автоматическое заполнение полей при сохранении
scheduleSchema.pre('save', async function(next) {
  if (this.lesson && (!this.teacher || !this.group || !this.course)) {
    try {
      const Lesson = mongoose.model('Lesson');
      const lesson = await Lesson.findById(this.lesson).populate('group course');
      
      if (lesson) {
        // Заполняем группу
        if (!this.group) {
          this.group = lesson.group;
        }
        
        // Заполняем курс
        if (!this.course) {
          this.course = lesson.course;
        }
        
        // Заполняем преподавателя из группы
        if (!this.teacher && lesson.group) {
          const Group = mongoose.model('Group');
          const group = await Group.findById(lesson.group).populate('teacher');
          if (group && group.teacher) {
            this.teacher = group.teacher;
          }
        }
        
        // Определяем формат из группы (можно добавить поле format в Group)
        if (this.group) {
          const Group = mongoose.model('Group');
          const group = await Group.findById(this.group);
          if (group) {
            // По умолчанию онлайн, но можно добавить поле format в Group
            this.format = group.format || 'онлайн';
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при автоматическом заполнении полей расписания:', error);
    }
  }
  next();
});

// Виртуальное поле для полной даты и времени
scheduleSchema.virtual('fullDateTime').get(function() {
  return this.dateTime.toISOString();
});

// Автоматический расчет времени окончания
scheduleSchema.pre('save', function(next) {
  if (this.dateTime && !this.endTime) {
    // Добавляем 1.5 часа (90 минут) к времени начала
    this.endTime = new Date(this.dateTime.getTime() + 90 * 60 * 1000);
  }
  next();
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
    'оффлайн': 'Оффлайн'
  };
  return formatMap[this.format] || this.format;
});

// Индексы для оптимизации
scheduleSchema.index({ dateTime: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ format: 1 });
scheduleSchema.index({ teacher: 1 });
scheduleSchema.index({ lesson: 1 });
scheduleSchema.index({ group: 1 });
scheduleSchema.index({ course: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule; 