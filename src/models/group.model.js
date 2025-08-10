import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'archived', 'completed'], 
    default: 'active' 
  },
  maxStudents: { 
    type: Number, 
    default: 15 
  },
  startDate: { type: Date },
  endDate: { type: Date },
  schedule: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Schedule' 
  }],
  // meetingLink: { type: String }, // Ссылка на онлайн встречи - убрано как необязательное
  // meetingPassword: { type: String }, // Пароль для встреч - убрано как необязательное
  // notes: { type: String }, // Заметки учителя о группе - убрано как необязательное
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Обновление времени изменения
groupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Виртуальное поле для количества учеников
groupSchema.virtual('studentCount').get(function() {
  return this.students.length;
});

// Индексы для оптимизации
groupSchema.index({ teacher: 1 });
groupSchema.index({ course: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ students: 1 });

const Group = mongoose.model('Group', groupSchema);
export default Group; 