import mongoose from 'mongoose';

// Схема для статистики по предмету
const subjectStatsSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  totalTests: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  lastTestDate: { type: Date },
  progressTrend: [{ // Для линейного графика
    date: { type: Date },
    score: { type: Number }
  }]
}, { _id: false });

// Схема для слабых тем
const weakTopicSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  averageScore: { type: Number },
  testCount: { type: Number },
  lastTestDate: { type: Date }
}, { _id: false });

// Схема для рекомендаций
const recommendationSchema = new mongoose.Schema({
  type: { type: String, enum: ['topic', 'test'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  priority: { type: Number, default: 1 }
}, { _id: false });

const userStatisticsSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  subjectStats: [subjectStatsSchema],
  weakTopics: [weakTopicSchema],
  recommendations: [recommendationSchema],
  lastUpdated: { type: Date, default: Date.now }
});

// Индексы для оптимизации запросов
userStatisticsSchema.index({ user: 1 });
userStatisticsSchema.index({ 'subjectStats.subject': 1 });
userStatisticsSchema.index({ 'weakTopics.topic': 1 });

const UserStatistics = mongoose.model('UserStatistics', userStatisticsSchema);
export default UserStatistics; 