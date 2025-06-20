import mongoose from 'mongoose';

const testHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  date: { type: Date, default: Date.now },
  level: { type: String },
  resultPercent: { type: Number, required: true },
  correct: { type: Number, required: true },
  total: { type: Number, required: true },
});

const TestHistory = mongoose.model('TestHistory', testHistorySchema);
export default TestHistory;

const testAnswerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  questionId: { type: String, required: true },
  selectedOptionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

const TestAnswer = mongoose.model('TestAnswer', testAnswerSchema);
export { TestAnswer };
