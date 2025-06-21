import mongoose from 'mongoose';

const answerProgressSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedOptionId: { type: String, required: true },
  },
  { _id: false }
);

const testProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    currentQuestionIndex: { type: Number, default: 0 },
    answers: [answerProgressSchema],
    timeLeft: { type: Number },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user has only one in-progress entry per test
testProgressSchema.index({ user: 1, test: 1 }, { unique: true });

const TestProgress = mongoose.model('TestProgress', testProgressSchema);

export default TestProgress;
