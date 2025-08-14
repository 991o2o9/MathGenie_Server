import mongoose from 'mongoose';
import Schedule from '../models/schedule.model.js';
import User from '../models/user.model.js';
import { sendNotification } from '../utils/notifications.js';

// Получить все занятия с фильтрацией
export const getSchedule = async (req, res) => {
  try {
    const { date, status, format, teacher, group } = req.query;
    const filter = {};

    // Фильтр по дате (теперь используем dateTime)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.dateTime = { $gte: startDate, $lt: endDate };
    }

    if (status) filter.status = status;
    if (format) filter.format = format;
    if (teacher) filter.teacher = teacher;
    if (group) filter.group = group;

    // Если пользователь авторизован и является студентом, показываем только его группу
    if (req.user && req.user.role === 'STUDENT') {
      const User = mongoose.model('User');
      const Group = mongoose.model('Group');
      
      const studentGroup = await Group.findOne({ students: req.user._id }).select('_id');
      if (studentGroup) {
        filter.group = studentGroup._id;
      } else {
        // Если студент не в группе, возвращаем пустой массив
        return res.json({
          success: true,
          data: []
        });
      }
    }

    const schedule = await Schedule.find(filter)
      .populate('lesson', 'title description')
      .populate('teacher', 'username profile.firstName profile.lastName')
      .populate('group', 'name')
      .populate('course', 'name')
      .sort({ dateTime: 1 })
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
    const requiredFields = ['dateTime', 'lesson'];
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

    // Получаем студентов группы для отправки уведомлений
    if (savedLesson.group) {
      const Group = mongoose.model('Group');
      const group = await Group.findById(savedLesson.group).populate('students');
      if (group && group.students) {
        const studentIds = group.students.map(student => student._id);
        await sendNotification('new_lesson', savedLesson, studentIds);
      }
    }

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
    const userId = req.user._id;

    const lesson = await Schedule.findById(id).populate('teacher');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Занятие не найдено'
      });
    }

    // Проверка прав доступа
    if (userRole === 'TEACHER' && lesson.teacher._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на редактирование этого занятия'
      });
    }

    // Учитель не может изменять некоторые поля
    if (userRole === 'TEACHER') {
      delete updateData.teacher; // Учитель не может менять преподавателя
      delete updateData.lesson; // Учитель не может менять урок
      delete updateData.group; // Учитель не может менять группу
    }

    const updatedLesson = await Schedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Получаем студентов группы для отправки уведомлений
    if (updatedLesson.group) {
      const Group = mongoose.model('Group');
      const group = await Group.findById(updatedLesson.group).populate('students');
      if (group && group.students) {
        const studentIds = group.students.map(student => student._id);
        await sendNotification('lesson_updated', updatedLesson, studentIds);
      }
    }

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

    if (userRole !== 'ADMIN') {
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

    // Получаем студентов группы для отправки уведомлений
    if (lesson.group) {
      const Group = mongoose.model('Group');
      const group = await Group.findById(lesson.group).populate('students');
      if (group && group.students) {
        const studentIds = group.students.map(student => student._id);
        await sendNotification('lesson_cancelled', lesson, studentIds);
      }
    }

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