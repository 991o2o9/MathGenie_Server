import mongoose from 'mongoose';

const subsectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Subsection = mongoose.model('Subsection', subsectionSchema);
export default Subsection;
