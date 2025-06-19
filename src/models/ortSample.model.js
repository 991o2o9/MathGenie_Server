import mongoose from 'mongoose';

const ortSampleSchema = new mongoose.Schema({
  content: { type: String }, // либо текст, либо путь к файлу
  file: { type: String }, // если файл
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  createdAt: { type: Date, default: Date.now },
});

const OrtSample = mongoose.model('OrtSample', ortSampleSchema);
export default OrtSample;
