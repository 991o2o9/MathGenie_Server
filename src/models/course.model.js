import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lessons: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson' 
  }],
  duration: { 
    type: Number, 
    required: false,
    default: 1
  }, // Длительность курса в месяцах
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'beginner' 
  },
  status: { 
    type: String, 
    enum: ['active', 'archived', 'draft'], 
    default: 'active' 
  },
  maxStudents: { 
    type: Number, 
    default: 20 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Обновление времени изменения
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Индексы для оптимизации
courseSchema.index({ teacher: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ level: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course; 