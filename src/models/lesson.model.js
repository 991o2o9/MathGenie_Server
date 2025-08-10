import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }, // Описание урока
  videoUrl: { type: String }, // Ссылка на видео (YouTube, Vimeo и т.д.)
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  group: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group' 
  },
  materials: [{ 
    name: { type: String },
    url: { type: String },
    type: { type: String, enum: ['pdf', 'doc', 'video', 'link'] }
  }], // Дополнительные материалы
  homework: {
    description: { type: String },
    dueDate: { type: Date },
    maxGrade: { type: Number, default: 100 }
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Обновление времени изменения
lessonSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Индексы для оптимизации
lessonSchema.index({ course: 1 });
lessonSchema.index({ group: 1 });
lessonSchema.index({ status: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson; 