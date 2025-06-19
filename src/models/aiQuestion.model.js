const mongoose = require('mongoose');

const aiQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  count: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AiQuestion', aiQuestionSchema);
