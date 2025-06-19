import mongoose from 'mongoose';

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

const Topic = mongoose.model('Topic', topicSchema);
export default Topic;
