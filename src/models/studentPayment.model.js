import mongoose from 'mongoose';

/**
 * Виртуальная модель для отображения студентов с информацией об оплате в админке
 * Эта модель не создает новую коллекцию, а использует существующую User
 */
const studentPaymentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  payment: {
    status: { 
      type: String, 
      enum: ['unpaid', 'pending', 'paid', 'overdue', 'cancelled'], 
      default: 'unpaid' 
    },
    amount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date },
    lastPaymentDate: { type: Date },
    notes: { type: String },
    updatedAt: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now }
}, {
  // Указываем, что это виртуальная модель
  collection: 'users',
  strict: false,
  // Добавляем поддержку для AdminJS
  timestamps: false
});

// Статические методы для работы с данными
studentPaymentSchema.statics.findStudents = async function() {
  const User = mongoose.model('User');
  return User.find({ role: 'STUDENT' })
    .populate('group', 'name')
    .select('username profile.firstName profile.lastName profile.email profile.phone group payment createdAt')
    .lean();
};

// Методы для AdminJS
studentPaymentSchema.statics.find = async function(query = {}) {
  const User = mongoose.model('User');
  const students = await User.find({ role: 'STUDENT', ...query })
    .populate('group', 'name')
    .select('username profile.firstName profile.lastName profile.email profile.phone group payment createdAt')
    .lean();
  
  // Преобразуем данные для совместимости с AdminJS
  return students.map(student => ({
    _id: student._id,
    username: student.username,
    firstName: student.profile?.firstName || '',
    lastName: student.profile?.lastName || '',
    email: student.profile?.email || '',
    phone: student.profile?.phone || '',
    group: student.group,
    payment: student.payment || {
      status: 'unpaid',
      amount: 0,
      paidAmount: 0,
      dueDate: null,
      lastPaymentDate: null,
      notes: '',
      updatedAt: new Date()
    },
    createdAt: student.createdAt
  }));
};

studentPaymentSchema.statics.findOne = async function(query = {}) {
  const User = mongoose.model('User');
  const student = await User.findOne({ role: 'STUDENT', ...query })
    .populate('group', 'name')
    .select('username profile.firstName profile.lastName profile.email profile.phone group payment createdAt')
    .lean();
  
  if (!student) return null;
  
  return {
    _id: student._id,
    username: student.username,
    firstName: student.profile?.firstName || '',
    lastName: student.profile?.lastName || '',
    email: student.profile?.email || '',
    phone: student.profile?.phone || '',
    group: student.group,
    payment: student.payment || {
      status: 'unpaid',
      amount: 0,
      paidAmount: 0,
      dueDate: null,
      lastPaymentDate: null,
      notes: '',
      updatedAt: new Date()
    },
    createdAt: student.createdAt
  };
};

studentPaymentSchema.statics.findById = async function(id) {
  return this.findOne({ _id: id });
};

studentPaymentSchema.statics.update = async function(id, updateData) {
  const User = mongoose.model('User');
  const result = await User.findByIdAndUpdate(id, updateData, { new: true });
  return result;
};

studentPaymentSchema.statics.count = async function(query = {}) {
  const User = mongoose.model('User');
  return User.countDocuments({ role: 'STUDENT', ...query });
};

studentPaymentSchema.statics.findWithPagination = async function(query = {}, options = {}) {
  const User = mongoose.model('User');
  const { limit = 10, offset = 0, sort = {} } = options;
  
  const students = await User.find({ role: 'STUDENT', ...query })
    .populate('group', 'name')
    .select('username profile.firstName profile.lastName profile.email profile.phone group payment createdAt')
    .sort(sort)
    .limit(limit)
    .skip(offset)
    .lean();
  
  // Преобразуем данные для совместимости с AdminJS
  return students.map(student => ({
    _id: student._id,
    username: student.username,
    firstName: student.profile?.firstName || '',
    lastName: student.profile?.lastName || '',
    email: student.profile?.email || '',
    phone: student.profile?.phone || '',
    group: student.group,
    payment: student.payment || {
      status: 'unpaid',
      amount: 0,
      paidAmount: 0,
      dueDate: null,
      lastPaymentDate: null,
      notes: '',
      updatedAt: new Date()
    },
    createdAt: student.createdAt
  }));
};

studentPaymentSchema.statics.findStudentById = async function(id) {
  const User = mongoose.model('User');
  return User.findOne({ _id: id, role: 'STUDENT' })
    .populate('group', 'name')
    .select('username profile.firstName profile.lastName profile.email profile.phone group payment createdAt')
    .lean();
};

studentPaymentSchema.statics.updateStudentPayment = async function(id, paymentData) {
  const User = mongoose.model('User');
  return User.findByIdAndUpdate(id, {
    payment: {
      ...paymentData,
      updatedAt: new Date()
    }
  }, { new: true });
};

// Виртуальные поля для удобства отображения
studentPaymentSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

studentPaymentSchema.virtual('isPaid').get(function() {
  return this.payment && this.payment.status === 'paid';
});

studentPaymentSchema.virtual('isOverdue').get(function() {
  if (!this.payment || !this.payment.dueDate) return false;
  return this.payment.status === 'unpaid' && new Date() > this.payment.dueDate;
});

studentPaymentSchema.virtual('paymentStatusLabel').get(function() {
  if (!this.payment) return 'Не определен';
  
  const statusLabels = {
    'unpaid': '❌ Не оплачено',
    'pending': '⏳ В ожидании',
    'paid': '✅ Оплачено',
    'overdue': '🚨 Просрочено',
    'cancelled': '❌ Отменено'
  };
  
  return statusLabels[this.payment.status] || 'Не определен';
});

// Настройка для правильного отображения виртуальных полей
studentPaymentSchema.set('toJSON', { virtuals: true });
studentPaymentSchema.set('toObject', { virtuals: true });

const StudentPayment = mongoose.model('StudentPayment', studentPaymentSchema);
export default StudentPayment;
