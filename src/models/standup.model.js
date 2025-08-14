import mongoose from 'mongoose';

const standupSchema = new mongoose.Schema({
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
  homework: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Homework', 
    required: true 
  },
  // Три поля стендапа, которые заполняет ученик
  whatDone: { 
    type: String, 
    required: true,
    label: 'Что сделано'
  },
  problems: { 
    type: String, 
    required: true,
    label: 'Проблемы'
  },
  whatWillDo: { 
    type: String, 
    required: true,
    label: 'Что буду делать'
  },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'reviewed'], 
    default: 'draft' 
  },
  teacherComment: { type: String }, // Комментарий учителя
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // Кто проверил
  reviewedAt: { type: Date },
  submittedAt: { type: Date },
  dueDate: { type: Date }, // Срок сдачи
  isLate: { type: Boolean, default: false }, // Сдано с опозданием
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Обновление времени изменения
standupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Проверка на опоздание
  if (this.dueDate && this.submittedAt) {
    this.isLate = this.submittedAt > this.dueDate;
  }
  
  next();
});

// Виртуальное поле для статуса на русском
standupSchema.virtual('statusText').get(function() {
  const statusMap = {
    'draft': 'Черновик',
    'submitted': 'Отправлено',
    'reviewed': 'Проверено'
  };
  return statusMap[this.status] || this.status;
});

// Индексы для оптимизации
standupSchema.index({ student: 1 });
standupSchema.index({ lesson: 1 });
standupSchema.index({ course: 1 });
standupSchema.index({ group: 1 });
standupSchema.index({ homework: 1 });
standupSchema.index({ status: 1 });
standupSchema.index({ submittedAt: 1 });

const Standup = mongoose.model('Standup', standupSchema);
export default Standup; 