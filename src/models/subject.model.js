import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
