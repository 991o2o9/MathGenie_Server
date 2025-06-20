import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  subtitle: { type: String },
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
