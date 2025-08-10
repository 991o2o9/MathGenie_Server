import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'TEACHER', 'STUDENT'], default: 'STUDENT' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // Группа ученика
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // Курсы ученика
  payment: {
    status: { 
      type: String, 
      enum: ['unpaid', 'pending', 'paid', 'overdue', 'cancelled'], 
      default: 'unpaid' 
    },
    amount: { type: Number, default: 0 }, // Сумма к оплате
    paidAmount: { type: Number, default: 0 }, // Оплаченная сумма
    dueDate: { type: Date }, // Дата, до которой нужно оплатить
    lastPaymentDate: { type: Date }, // Дата последней оплаты
    notes: { type: String }, // Комментарии администратора
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Кто обновил статус
    updatedAt: { type: Date, default: Date.now }
  },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    avatar: { type: String }, // URL аватара
    bio: { type: String }, // Краткое описание
  },
  createdAt: { type: Date, default: Date.now },
});

// Виртуальное поле для обратной совместимости
userSchema.virtual('isPaid').get(function() {
  return this.payment && this.payment.status === 'paid';
});

// Индексы для оптимизации
userSchema.index({ 'payment.status': 1 });
userSchema.index({ 'payment.dueDate': 1 });
userSchema.index({ role: 1, 'payment.status': 1 });

const User = mongoose.model('User', userSchema);
export default User;
