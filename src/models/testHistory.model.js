const mongoose = require('mongoose');

const testHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  date: { type: Date, default: Date.now },
  level: { type: String },
  resultPercent: { type: Number, required: true },
  correct: { type: Number, required: true },
  total: { type: Number, required: true },
});

module.exports = mongoose.model('TestHistory', testHistorySchema);
