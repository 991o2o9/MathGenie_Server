import mongoose from 'mongoose';

const aiQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  count: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  answer: { type: String },
});

const AiQuestion = mongoose.model('AiQuestion', aiQuestionSchema);
export default AiQuestion;
