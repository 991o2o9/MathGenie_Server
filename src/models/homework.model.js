import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lesson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson', 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  group: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true 
  },
  files: [{ 
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number }
  }], // Загруженные файлы
  text: { type: String }, // Текстовое описание работы
  status: { 
    type: String, 
    enum: ['submitted', 'graded', 'overdue', 'draft'], 
    default: 'draft' 
  },
  grade: { 
    type: Number, 
    min: 0, 
    max: 100 
  }, // Оценка от учителя
  teacherComment: { type: String }, // Комментарий учителя
  submittedAt: { type: Date },
  gradedAt: { type: Date },
  gradedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Кто поставил оценку
  dueDate: { type: Date }, // Срок сдачи
  isLate: { type: Boolean, default: false }, // Сдано с опозданием
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Обновление времени изменения
homeworkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Проверка на опоздание
  if (this.dueDate && this.submittedAt) {
    this.isLate = this.submittedAt > this.dueDate;
  }
  
  next();
});

// Виртуальное поле для статуса
homeworkSchema.virtual('statusText').get(function() {
  const statusMap = {
    'draft': 'Черновик',
    'submitted': 'Отправлено',
    'graded': 'Оценено',
    'overdue': 'Просрочено'
  };
  return statusMap[this.status] || this.status;
});

// Индексы для оптимизации
homeworkSchema.index({ student: 1 });
homeworkSchema.index({ lesson: 1 });
homeworkSchema.index({ course: 1 });
homeworkSchema.index({ group: 1 });
homeworkSchema.index({ status: 1 });
homeworkSchema.index({ submittedAt: 1 });

const Homework = mongoose.model('Homework', homeworkSchema);
export default Homework; 