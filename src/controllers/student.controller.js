import Course from '../models/course.model.js';
import Group from '../models/group.model.js';
import Lesson from '../models/lesson.model.js';
import Homework from '../models/homework.model.js';
import Schedule from '../models/schedule.model.js';
import Standup from '../models/standup.model.js';
import User from '../models/user.model.js';

/**
 * Получить информацию о группе ученика
 */
async function getStudentGroup(req, res) {
  try {
    const studentId = req.user._id;

    const group = await Group.findOne({ students: studentId })
      .populate('teacher', 'username profile.firstName profile.lastName')
      .populate('course', 'name description level duration')
      .populate('students', 'username profile.firstName profile.lastName');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    res.json({
      success: true,
      data: {
        id: group._id,
        name: group.name,
        description: group.description,
        teacher: group.teacher,
        course: group.course,
        students: group.students,
        studentCount: group.students.length,
        maxStudents: group.maxStudents,
        status: group.status,
        startDate: group.startDate,
        endDate: group.endDate,
        // meetingLink: group.meetingLink, // убрано как необязательное
        // notes: group.notes // убрано как необязательное
      }
    });
  } catch (error) {
    console.error('Ошибка получения информации о группе:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения информации о группе',
      error: error.message
    });
  }
}

/**
 * Получить уроки курса ученика
 */
async function getStudentLessons(req, res) {
  try {
    const studentId = req.user._id;
    const { status } = req.query;

    // Получаем группу ученика
    const group = await Group.findOne({ students: studentId }).select('course');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    let query = { course: group.course };
    if (status) {
      query.status = status;
    }

    const lessons = await Lesson.find(query)
      .sort({ order: 1 })
      .select('title description videoUrl videoDuration order duration materials homework status tags');

    const formattedLessons = lessons.map(lesson => ({
      id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      videoDuration: lesson.videoDuration,
      order: lesson.order,
      duration: lesson.duration,
      materials: lesson.materials,
      homework: lesson.homework,
      status: lesson.status,
      tags: lesson.tags
    }));

    res.json({
      success: true,
      data: formattedLessons
    });
  } catch (error) {
    console.error('Ошибка получения уроков:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения уроков',
      error: error.message
    });
  }
}

/**
 * Получить детали конкретного урока
 */
async function getStudentLesson(req, res) {
  try {
    const studentId = req.user._id;
    const lessonId = req.params.id;

    // Проверяем, что ученик имеет доступ к уроку через группу
    const group = await Group.findOne({ students: studentId }).select('course');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: group.course })
      .populate('course', 'name description');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Урок не найден или у вас нет к нему доступа'
      });
    }

    // Проверяем, есть ли уже домашнее задание у ученика
    const existingHomework = await Homework.findOne({
      student: studentId,
      lesson: lessonId
    });

    res.json({
      success: true,
      data: {
        id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        order: lesson.order,
        duration: lesson.duration,
        materials: lesson.materials,
        homework: lesson.homework,
        status: lesson.status,
        tags: lesson.tags,
        course: lesson.course,
        hasHomework: !!existingHomework,
        homeworkStatus: existingHomework?.status || null
      }
    });
  } catch (error) {
    console.error('Ошибка получения урока:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения урока',
      error: error.message
    });
  }
}

/**
 * Получить расписание ученика
 */
async function getStudentSchedule(req, res) {
  try {
    const studentId = req.user._id;
    const { startDate, endDate } = req.query;

    // Получаем группу ученика
    const group = await Group.findOne({ students: studentId }).select('_id');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    let query = { group: group._id };
    
    // Фильтр по датам (теперь используем dateTime)
    if (startDate && endDate) {
      query.dateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await Schedule.find(query)
      .populate('lesson', 'title description videoUrl')
      .populate('course', 'name')
      .populate('group', 'name')
      .populate('teacher', 'username profile.firstName profile.lastName')
      .sort({ dateTime: 1 });

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule._id,
      lesson: schedule.lesson,
      course: schedule.course,
      group: schedule.group,
      teacher: schedule.teacher,
      dateTime: schedule.dateTime,
      endTime: schedule.endTime,
      format: schedule.format,
      status: schedule.status,
      statusText: schedule.statusText,
      // Добавляем виртуальные поля для удобства
      date: schedule.dateTime.toISOString().split('T')[0],
      startTime: schedule.dateTime.toTimeString().slice(0, 5),
      duration: Math.round((schedule.endTime - schedule.dateTime) / (1000 * 60)) // в минутах
    }));

    res.json({
      success: true,
      data: formattedSchedules
    });
  } catch (error) {
    console.error('Ошибка получения расписания:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения расписания',
      error: error.message
    });
  }
}

/**
 * Отправить домашнее задание
 */
async function submitHomework(req, res) {
  try {
    const studentId = req.user._id;
    const { lessonId, files, text } = req.body;

    // Проверяем, что ученик имеет доступ к уроку
    const group = await Group.findOne({ students: studentId }).select('_id course');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: group.course });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Урок не найден или у вас нет к нему доступа'
      });
    }

    // Проверяем, не отправлено ли уже домашнее задание
    const existingHomework = await Homework.findOne({
      student: studentId,
      lesson: lessonId
    });

    if (existingHomework && existingHomework.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Домашнее задание уже отправлено'
      });
    }

    // Создаем или обновляем домашнее задание
    const homeworkData = {
      student: studentId,
      lesson: lessonId,
      course: group.course,
      group: group._id,
      files: files || [],
      text: text || '',
      status: 'submitted',
      submittedAt: new Date(),
      dueDate: lesson.homework?.dueDate
    };

    let homework;
    if (existingHomework) {
      homework = await Homework.findByIdAndUpdate(
        existingHomework._id,
        homeworkData,
        { new: true }
      );
    } else {
      homework = await Homework.create(homeworkData);
    }

    const populatedHomework = await Homework.findById(homework._id)
      .populate('lesson', 'title order')
      .populate('course', 'name')
      .populate('group', 'name');

    res.status(201).json({
      success: true,
      message: 'Домашнее задание успешно отправлено',
      data: populatedHomework
    });
  } catch (error) {
    console.error('Ошибка отправки домашнего задания:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка отправки домашнего задания',
      error: error.message
    });
  }
}

/**
 * Получить домашние задания ученика
 */
async function getStudentHomework(req, res) {
  try {
    const studentId = req.user._id;
    const { status } = req.query;

    let query = { student: studentId };
    if (status) {
      query.status = status;
    }

    const homework = await Homework.find(query)
      .populate('lesson', 'title order')
      .populate('course', 'name')
      .populate('group', 'name')
      .sort({ submittedAt: -1 });

    const formattedHomework = homework.map(hw => ({
      id: hw._id,
      lesson: hw.lesson,
      course: hw.course,
      group: hw.group,
      status: hw.status,
      statusText: hw.statusText,
      grade: hw.grade,
      teacherComment: hw.teacherComment,
      submittedAt: hw.submittedAt,
      gradedAt: hw.gradedAt,
      dueDate: hw.dueDate,
      isLate: hw.isLate,
      files: hw.files,
      text: hw.text
    }));

    res.json({
      success: true,
      data: formattedHomework
    });
  } catch (error) {
    console.error('Ошибка получения домашних заданий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения домашних заданий',
      error: error.message
    });
  }
}

/**
 * Отправить стендап
 */
async function submitStandup(req, res) {
  try {
    const studentId = req.user._id;
    const { lessonId, type, content, title, description } = req.body;

    // Проверяем, что ученик имеет доступ к уроку
    const group = await Group.findOne({ students: studentId }).select('_id course');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: group.course });
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Урок не найден или у вас нет к нему доступа'
      });
    }

    // Проверяем, не отправлен ли уже стендап
    const existingStandup = await Standup.findOne({
      student: studentId,
      lesson: lessonId
    });

    if (existingStandup && existingStandup.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Стендап уже отправлен'
      });
    }

    // Создаем или обновляем стендап
    const standupData = {
      student: studentId,
      lesson: lessonId,
      course: group.course,
      group: group._id,
      type,
      content,
      title,
      description,
      status: 'submitted',
      submittedAt: new Date()
    };

    let standup;
    if (existingStandup) {
      standup = await Standup.findByIdAndUpdate(
        existingStandup._id,
        standupData,
        { new: true }
      );
    } else {
      standup = await Standup.create(standupData);
    }

    const populatedStandup = await Standup.findById(standup._id)
      .populate('lesson', 'title order')
      .populate('course', 'name')
      .populate('group', 'name');

    res.status(201).json({
      success: true,
      message: 'Стендап успешно отправлен',
      data: populatedStandup
    });
  } catch (error) {
    console.error('Ошибка отправки стендапа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка отправки стендапа',
      error: error.message
    });
  }
}

/**
 * Получить прогресс ученика по курсу
 */
async function getStudentProgress(req, res) {
  try {
    const studentId = req.user._id;

    // Получаем группу ученика
    const group = await Group.findOne({ students: studentId })
      .populate('course', 'name description level duration')
      .populate('teacher', 'username profile.firstName profile.lastName');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Вы не состоите ни в одной группе'
      });
    }

    // Получаем все уроки курса
    const lessons = await Lesson.find({ course: group.course })
      .sort({ order: 1 })
      .select('title order status');

    // Получаем домашние задания ученика
    const homework = await Homework.find({ student: studentId, course: group.course })
      .select('lesson grade status');

    // Получаем стендапы ученика
    const standups = await Standup.find({ student: studentId, course: group.course })
      .select('lesson status');

    // Формируем прогресс по урокам
    const lessonProgress = lessons.map(lesson => {
      const lessonHomework = homework.find(hw => hw.lesson.toString() === lesson._id.toString());
      const lessonStandup = standups.find(st => st.lesson.toString() === lesson._id.toString());

      return {
        lessonId: lesson._id,
        title: lesson.title,
        order: lesson.order,
        status: lesson.status,
        hasHomework: !!lessonHomework,
        homeworkStatus: lessonHomework?.status || null,
        homeworkGrade: lessonHomework?.grade || null,
        hasStandup: !!lessonStandup,
        standupStatus: lessonStandup?.status || null
      };
    });

    // Статистика
    const totalLessons = lessons.length;
    const completedLessons = lessonProgress.filter(lp => lp.hasHomework || lp.hasStandup).length;
    const gradedHomework = homework.filter(hw => hw.status === 'graded').length;
    const avgGrade = homework.length > 0 
      ? homework.reduce((sum, hw) => sum + (hw.grade || 0), 0) / homework.length 
      : 0;

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          teacher: group.teacher
        },
        course: group.course,
        progress: {
          totalLessons,
          completedLessons,
          completionPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          gradedHomework,
          avgGrade: Math.round(avgGrade)
        },
        lessonProgress
      }
    });
  } catch (error) {
    console.error('Ошибка получения прогресса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения прогресса',
      error: error.message
    });
  }
}

export {
  getStudentGroup,
  getStudentLessons,
  getStudentLesson,
  getStudentSchedule,
  submitHomework,
  getStudentHomework,
  submitStandup,
  getStudentProgress
}; 