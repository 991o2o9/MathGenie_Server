import Schedule from '../models/schedule.model.js';
import User from '../models/user.model.js';
import { sendNotification } from '../utils/notifications.js';

// Получить все занятия с фильтрацией
export const getSchedule = async (req, res) => {
  try {
    const { date, status, format, teacher } = req.query;
    const filter = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (status) filter.status = status;
    if (format) filter.format = format;
    if (teacher) filter.teacher = teacher;

    const schedule = await Schedule.find(filter)
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении расписания',
      error: error.message
    });
  }
};

// Получить одно занятие по ID
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await Schedule.findById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Занятие не найдено'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении занятия',
      error: error.message
    });
  }
};

// Создать новое занятие (только администратор)
export const createSchedule = async (req, res) => {
  try {
    const lessonData = req.body;
    
    // Проверка обязательных полей
    const requiredFields = ['date', 'startTime', 'endTime', 'title', 'teacher'];
    for (const field of requiredFields) {
      if (!lessonData[field]) {
        return res.status(400).json({
          success: false,
          message: `Поле ${field} обязательно для заполнения`
        });
      }
    }

    const newLesson = new Schedule(lessonData);
    const savedLesson = await newLesson.save();

    // Получаем всех студентов для отправки уведомлений
    const students = await User.find({ role: 'STUDENT' }).select('_id');
    const studentIds = students.map(student => student._id);

    // Отправка уведомлений студентам о новом занятии
    await sendNotification('new_lesson', savedLesson, studentIds);

    res.status(201).json({
      success: true,
      message: 'Занятие успешно создано',
      data: savedLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании занятия',
      error: error.message
    });
  }
};

// Обновить занятие (администратор и учитель)
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.user.role;
    const userTeacherName = req.user.name; // Предполагаем, что у пользователя есть поле name

    const lesson = await Schedule.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Занятие не найдено'
      });
    }

    // Проверка прав доступа
    if (userRole === 'teacher' && lesson.teacher !== userTeacherName) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого занятия'
      });
    }

    // Учитель не может изменять некоторые поля
    if (userRole === 'teacher') {
      delete updateData.teacher; // Учитель не может менять преподавателя
      delete updateData.status; // Учитель не может менять статус на "отменён"
    }

    const updatedLesson = await Schedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Получаем всех студентов для отправки уведомлений
    const students = await User.find({ role: 'STUDENT' }).select('_id');
    const studentIds = students.map(student => student._id);

    // Отправка уведомлений об изменениях
    await sendNotification('lesson_updated', updatedLesson, studentIds);

    res.json({
      success: true,
      message: 'Занятие успешно обновлено',
      data: updatedLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении занятия',
      error: error.message
    });
  }
};

// Удалить занятие (только администратор)
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Только администратор может удалять занятия'
      });
    }

    const lesson = await Schedule.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Занятие не найдено'
      });
    }

    await Schedule.findByIdAndDelete(id);

    // Получаем всех студентов для отправки уведомлений
    const students = await User.find({ role: 'STUDENT' }).select('_id');
    const studentIds = students.map(student => student._id);

    // Отправка уведомлений об отмене занятия
    await sendNotification('lesson_cancelled', lesson, studentIds);

    res.json({
      success: true,
      message: 'Занятие успешно удалено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении занятия',
      error: error.message
    });
  }
};

// Массовый импорт занятий (только администратор)
export const bulkImportSchedule = async (req, res) => {
  try {
    const { lessons } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Только администратор может импортировать занятия'
      });
    }

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат данных для импорта'
      });
    }

    const createdLessons = [];
    const errors = [];

    for (const lessonData of lessons) {
      try {
        const lesson = new Schedule(lessonData);
        const savedLesson = await lesson.save();
        createdLessons.push(savedLesson);
      } catch (error) {
        errors.push({
          lesson: lessonData,
          error: error.message
        });
      }
    }

    // Получаем всех студентов для отправки уведомлений
    const students = await User.find({ role: 'STUDENT' }).select('_id');
    const studentIds = students.map(student => student._id);

    // Отправка уведомлений о новых занятиях
    for (const lesson of createdLessons) {
      await sendNotification('new_lesson', lesson, studentIds);
    }

    res.json({
      success: true,
      message: `Импортировано ${createdLessons.length} занятий`,
      data: {
        created: createdLessons,
        errors: errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при массовом импорте',
      error: error.message
    });
  }
};

// Изменить статус занятия (администратор и учитель)
export const changeLessonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;
    const userTeacherName = req.user.name;

    const lesson = await Schedule.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Занятие не найдено'
      });
    }

    // Проверка прав доступа
    if (userRole === 'teacher' && lesson.teacher !== userTeacherName) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на изменение этого занятия'
      });
    }

    // Учитель не может отменять занятия
    if (userRole === 'teacher' && status === 'отменён') {
      return res.status(403).json({
        success: false,
        message: 'Учитель не может отменять занятия'
      });
    }

    const updatedLesson = await Schedule.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    // Получаем всех студентов для отправки уведомлений
    const students = await User.find({ role: 'STUDENT' }).select('_id');
    const studentIds = students.map(student => student._id);

    // Отправка уведомлений об изменении статуса
    await sendNotification('lesson_status_changed', updatedLesson, studentIds);

    res.json({
      success: true,
      message: 'Статус занятия успешно изменён',
      data: updatedLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при изменении статуса',
      error: error.message
    });
  }
}; 