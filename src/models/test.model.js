import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  optionId: { type: String, required: true },
  text: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  text: { type: String, required: true },
  options: [optionSchema],
  correctOptionId: { type: String, required: true },
  explanation: { type: String }, // Краткое объяснение
});

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  difficulty: {
    type: String,
    enum: ['начальный', 'средний', 'продвинутый'],
    required: true,
  },
  questions: [questionSchema],
  timeLimit: { type: Number, required: true }, // seconds
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Test = mongoose.model('Test', testSchema);
export default Test;
