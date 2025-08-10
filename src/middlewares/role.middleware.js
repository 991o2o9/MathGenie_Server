// Middleware для проверки ролей пользователей

/**
 * Проверяет, является ли пользователь администратором
 */
export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
  }

  next();
}

/**
 * Проверяет, является ли пользователь учителем
 */
export function isTeacher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права учителя' });
  }

  next();
}

/**
 * Проверяет, является ли пользователь учеником
 */
export function isStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  if (req.user.role !== 'STUDENT' && req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права ученика' });
  }

  next();
}

/**
 * Проверяет, является ли пользователь учителем или администратором
 */
export function isTeacherOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права учителя или администратора' });
  }

  next();
}

/**
 * Проверяет, является ли пользователь учеником или учителем
 */
export function isStudentOrTeacher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права ученика или учителя' });
  }

  next();
}

/**
 * Проверяет, является ли пользователь владельцем ресурса или администратором
 */
export function isOwnerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  // Администраторы имеют доступ ко всему
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Проверяем, является ли пользователь владельцем ресурса
  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
    return next();
  }

  return res.status(403).json({ message: 'Доступ запрещен. Вы не являетесь владельцем этого ресурса' });
}

/**
 * Проверяет, является ли пользователь учителем группы или администратором
 */
export function isGroupTeacherOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Пользователь не авторизован' });
  }

  // Администраторы имеют доступ ко всему
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Учителя могут работать с группами, где они являются учителями
  if (req.user.role === 'TEACHER') {
    return next(); // Дополнительная проверка будет в контроллере
  }

  return res.status(403).json({ message: 'Доступ запрещен. Требуются права учителя или администратора' });
}

export default {
  isAdmin,
  isTeacher,
  isStudent,
  isTeacherOrAdmin,
  isStudentOrTeacher,
  isOwnerOrAdmin,
  isGroupTeacherOrAdmin
};
