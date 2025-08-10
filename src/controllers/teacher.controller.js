import Course from '../models/course.model.js';
import Group from '../models/group.model.js';
import Lesson from '../models/lesson.model.js';
import Homework from '../models/homework.model.js';
import Schedule from '../models/schedule.model.js';
import Standup from '../models/standup.model.js';
import User from '../models/user.model.js';

/**
 * Получить все группы учителя
 */
async function getTeacherGroups(req, res) {
  try {
    const teacherId = req.user._id;
    const { status } = req.query;

    let query = { teacher: teacherId };
    
    if (status) {
      query.status = status;
    }

    const groups = await Group.find(query)
      .populate('course', 'name description level')
      .populate('students', 'username profile.firstName profile.lastName')
      .populate('teacher', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    const formattedGroups = groups.map(group => ({
      id: group._id,
      name: group.name,
      description: group.description,
      course: group.course,
      teacher: group.teacher,
      students: group.students,
      studentCount: group.students.length,
      maxStudents: group.maxStudents,
      status: group.status,
      startDate: group.startDate,
      endDate: group.endDate,
              // meetingLink: group.meetingLink, // убрано как необязательное
        // notes: group.notes // убрано как необязательное,
      createdAt: group.createdAt
    }));

    res.json({
      success: true,
      data: formattedGroups
    });
  } catch (error) {
    console.error('Ошибка получения групп учителя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения групп',
      error: error.message
    });
  }
}

/**
 * Создать новую группу
 */
async function createGroup(req, res) {
  try {
    const teacherId = req.user._id;
    const { name, description, courseId, studentIds, maxStudents, startDate, endDate } = req.body;

    // Проверяем, что курс существует и принадлежит учителю
    const course = await Course.findOne({ _id: courseId, teacher: teacherId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Курс не найден или у вас нет прав на него'
      });
    }

    // Проверяем, что все ученики существуют
    if (studentIds && studentIds.length > 0) {
      const students = await User.find({ _id: { $in: studentIds }, role: 'STUDENT' });
      if (students.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Некоторые ученики не найдены'
        });
      }
    }

    const group = await Group.create({
      name,
      description,
      teacher: teacherId,
      course: courseId,
      students: studentIds || [],
      maxStudents: maxStudents || 15,
      startDate,
      endDate,
      status: 'active'
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('course', 'name description level')
      .populate('students', 'username profile.firstName profile.lastName')
      .populate('teacher', 'username profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      message: 'Группа успешно создана',
      data: populatedGroup
    });
  } catch (error) {
    console.error('Ошибка создания группы:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания группы',
      error: error.message
    });
  }
}

/**
 * Обновить группу
 */
async function updateGroup(req, res) {
  try {
    const teacherId = req.user._id;
    const groupId = req.params.id;
    const updateData = req.body;

    // Проверяем, что группа принадлежит учителю
    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Группа не найдена или у вас нет прав на неё'
      });
    }

    // Если обновляется курс, проверяем права
    if (updateData.courseId) {
      const course = await Course.findOne({ _id: updateData.courseId, teacher: teacherId });
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Курс не найден или у вас нет прав на него'
        });
      }
      updateData.course = updateData.courseId;
      delete updateData.courseId;
    }

    // Если обновляются ученики, проверяем их существование
    if (updateData.studentIds) {
      const students = await User.find({ _id: { $in: updateData.studentIds }, role: 'STUDENT' });
      if (students.length !== updateData.studentIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Некоторые ученики не найдены'
        });
      }
      updateData.students = updateData.studentIds;
      delete updateData.studentIds;
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      updateData,
      { new: true }
    ).populate('course', 'name description level')
     .populate('students', 'username profile.firstName profile.lastName')
     .populate('teacher', 'username profile.firstName profile.lastName');

    res.json({
      success: true,
      message: 'Группа успешно обновлена',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Ошибка обновления группы:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления группы',
      error: error.message
    });
  }
}

/**
 * Получить домашние задания для оценки
 */
async function getHomeworkForGrading(req, res) {
  try {
    const teacherId = req.user._id;
    const { status, groupId, lessonId } = req.query;

    let query = {};
    
    // Получаем группы учителя
    const teacherGroups = await Group.find({ teacher: teacherId }).select('_id');
    const groupIds = teacherGroups.map(g => g._id);
    
    query.group = { $in: groupIds };

    if (status) {
      query.status = status;
    }
    if (groupId) {
      query.group = groupId;
    }
    if (lessonId) {
      query.lesson = lessonId;
    }

    const homework = await Homework.find(query)
      .populate('student', 'username profile.firstName profile.lastName')
      .populate('lesson', 'title order')
      .populate('course', 'name')
      .populate('group', 'name')
      .sort({ submittedAt: -1 });

    const formattedHomework = homework.map(hw => ({
      id: hw._id,
      student: hw.student,
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
 * Оценить домашнее задание
 */
async function gradeHomework(req, res) {
  try {
    const teacherId = req.user._id;
    const homeworkId = req.params.id;
    const { grade, teacherComment } = req.body;

    // Проверяем, что домашнее задание принадлежит группе учителя
    const homework = await Homework.findById(homeworkId)
      .populate('group', 'teacher');

    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Домашнее задание не найдено'
      });
    }

    if (homework.group.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'У вас нет прав на оценку этого домашнего задания'
      });
    }

    // Валидация оценки
    if (grade !== undefined && (grade < 0 || grade > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Оценка должна быть от 0 до 100'
      });
    }

    const updatedHomework = await Homework.findByIdAndUpdate(
      homeworkId,
      {
        grade,
        teacherComment,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: teacherId
      },
      { new: true }
    ).populate('student', 'username profile.firstName profile.lastName')
     .populate('lesson', 'title order')
     .populate('course', 'name')
     .populate('group', 'name');

    res.json({
      success: true,
      message: 'Домашнее задание успешно оценено',
      data: updatedHomework
    });
  } catch (error) {
    console.error('Ошибка оценки домашнего задания:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка оценки домашнего задания',
      error: error.message
    });
  }
}

/**
 * Получить статистику по группам
 */
async function getGroupStatistics(req, res) {
  try {
    const teacherId = req.user._id;
    const { groupId } = req.params;

    let query = { teacher: teacherId };
    if (groupId) {
      query._id = groupId;
    }

    const groups = await Group.find(query)
      .populate('students', 'username profile.firstName profile.lastName')
      .populate('course', 'name');

    const statistics = await Promise.all(groups.map(async (group) => {
      // Статистика по домашним заданиям
      const homeworkStats = await Homework.aggregate([
        { $match: { group: group._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
            graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
            overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
            avgGrade: { $avg: '$grade' }
          }
        }
      ]);

      // Статистика по стендапам
      const standupStats = await Standup.aggregate([
        { $match: { group: group._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
            reviewed: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } }
          }
        }
      ]);

      return {
        groupId: group._id,
        groupName: group.name,
        courseName: group.course.name,
        studentCount: group.students.length,
        maxStudents: group.maxStudents,
        status: group.status,
        homework: homeworkStats[0] || { total: 0, submitted: 0, graded: 0, overdue: 0, avgGrade: 0 },
        standups: standupStats[0] || { total: 0, submitted: 0, reviewed: 0 }
      };
    }));

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Ошибка получения статистики групп:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики',
      error: error.message
    });
  }
}

/**
 * Получить учеников для добавления в группу
 */
async function getAvailableStudents(req, res) {
  try {
    const { groupId, search } = req.query;

    let query = { role: 'STUDENT' };

    // Если указана группа, исключаем учеников, которые уже в ней
    if (groupId) {
      const group = await Group.findById(groupId).select('students');
      if (group) {
        query._id = { $nin: group.students };
      }
    }

    // Поиск по имени или username
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('username profile.firstName profile.lastName profile.email')
      .limit(20)
      .sort({ username: 1 });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Ошибка получения доступных учеников:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения учеников',
      error: error.message
    });
  }
}

export {
  getTeacherGroups,
  createGroup,
  updateGroup,
  getHomeworkForGrading,
  gradeHomework,
  getGroupStatistics,
  getAvailableStudents
}; 