const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  explanation: { type: String },
  subsection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subsection',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Topic', topicSchema);
