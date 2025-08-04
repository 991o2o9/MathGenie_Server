import UserStatistics from '../models/userStatistics.model.js';
import TestHistory from '../models/testHistory.model.js';
import Test from '../models/test.model.js';
import Topic from '../models/topic.model.js';
import Subject from '../models/subject.model.js';

/**
 * Получить общую статистику пользователя (гистограмма по темам)
 */
async function getUserStatistics(req, res) {
  try {
    const userId = req.user._id;
    
    let userStats = await UserStatistics.findOne({ user: userId })
      .populate('subjectStats.subject', 'name')
      .populate('weakTopics.topic', 'name')
      .populate('weakTopics.subject', 'name');

    // Если статистики нет, создаем её
    if (!userStats) {
      await updateUserStatistics(userId);
      userStats = await UserStatistics.findOne({ user: userId })
        .populate('subjectStats.subject', 'name')
        .populate('weakTopics.topic', 'name')
        .populate('weakTopics.subject', 'name');
    }

    // Форматируем данные для гистограммы
    const subjectChartData = userStats.subjectStats.map(stat => ({
      subjectName: stat.subject.name,
      totalTests: stat.totalTests,
      totalQuestions: stat.totalQuestions,
      correctAnswers: stat.correctAnswers,
      averageScore: stat.averageScore,
      accuracy: stat.totalQuestions > 0 ? Math.round((stat.correctAnswers / stat.totalQuestions) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        subjectChartData,
        weakTopics: userStats.weakTopics.map(topic => ({
          topicName: topic.topic?.name || 'Неизвестная тема',
          subjectName: topic.subject?.name || 'Неизвестный предмет',
          averageScore: topic.averageScore,
          testCount: topic.testCount,
          lastTestDate: topic.lastTestDate
        })),
        lastUpdated: userStats.lastUpdated
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка получения статистики',
      error: error.message 
    });
  }
}

/**
 * Получить прогресс пользователя по времени (линейный график)
 */
async function getProgressTrend(req, res) {
  try {
    const userId = req.user._id;
    const { subjectId } = req.query;

    let userStats = await UserStatistics.findOne({ user: userId });
    
    if (!userStats) {
      await updateUserStatistics(userId);
      userStats = await UserStatistics.findOne({ user: userId });
    }

    let progressData;
    
    if (subjectId) {
      // Прогресс по конкретному предмету
      const subjectStat = userStats.subjectStats.find(
        stat => stat.subject.toString() === subjectId
      );
      
      if (!subjectStat) {
        return res.status(404).json({
          success: false,
          message: 'Статистика по данному предмету не найдена'
        });
      }
      
      progressData = subjectStat.progressTrend.map(point => ({
        date: point.date,
        score: point.score
      }));
    } else {
      // Общий прогресс по всем предметам
      const allProgress = userStats.subjectStats.flatMap(stat => 
        stat.progressTrend.map(point => ({
          date: point.date,
          score: point.score,
          subject: stat.subject
        }))
      );
      
      // Группируем по дате и усредняем
      const groupedByDate = {};
      allProgress.forEach(point => {
        const dateKey = point.date.toISOString().split('T')[0];
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = { scores: [], count: 0 };
        }
        groupedByDate[dateKey].scores.push(point.score);
        groupedByDate[dateKey].count++;
      });
      
      progressData = Object.entries(groupedByDate)
        .map(([date, data]) => ({
          date: new Date(date),
          score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count)
        }))
        .sort((a, b) => a.date - b.date);
    }

    res.json({
      success: true,
      data: progressData
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

/**
 * Получить персонализированные рекомендации
 */
async function getRecommendations(req, res) {
  try {
    const userId = req.user._id;
    
    let userStats = await UserStatistics.findOne({ user: userId })
      .populate('recommendations.targetId')
      .populate('weakTopics.topic', 'name')
      .populate('weakTopics.subject', 'name');

    if (!userStats) {
      await updateUserStatistics(userId);
      userStats = await UserStatistics.findOne({ user: userId })
        .populate('recommendations.targetId')
        .populate('weakTopics.topic', 'name')
        .populate('weakTopics.subject', 'name');
    }

    // Форматируем рекомендации
    const formattedRecommendations = userStats.recommendations.map(rec => ({
      type: rec.type,
      targetId: rec.targetId._id,
      targetName: rec.targetId.title || rec.targetId.name,
      reason: rec.reason,
      priority: rec.priority
    }));

    // Форматируем слабые темы
    const weakTopics = userStats.weakTopics.map(topic => ({
      topicName: topic.topic?.name || 'Неизвестная тема',
      subjectName: topic.subject?.name || 'Неизвестный предмет',
      averageScore: topic.averageScore,
      testCount: topic.testCount,
      recommendation: `Тебе стоит сосредоточиться на "${topic.topic?.name}" — ${Math.round(topic.averageScore)}% правильных`
    }));

    res.json({
      success: true,
      data: {
        recommendations: formattedRecommendations,
        weakTopics,
        lastUpdated: userStats.lastUpdated
      }
    });
  } catch (error) {
    console.error('Ошибка получения рекомендаций:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения рекомендаций',
      error: error.message
    });
  }
}

/**
 * Обновить статистику пользователя
 */
async function updateUserStatistics(userId) {
  try {
    // Получаем всю историю тестов пользователя
    const testHistories = await TestHistory.find({ user: userId })
      .populate('subject', 'name')
      .populate({
        path: 'test',
        populate: { path: 'topic', populate: { path: 'subsection' } }
      })
      .sort({ date: 1 });

    if (testHistories.length === 0) {
      // Если нет истории, создаем пустую статистику
      await UserStatistics.findOneAndUpdate(
        { user: userId },
        { 
          user: userId,
          subjectStats: [],
          weakTopics: [],
          recommendations: [],
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
      return;
    }

    // Группируем по предметам
    const subjectGroups = {};
    const topicGroups = {};

    testHistories.forEach(history => {
      const subjectId = history.subject._id.toString();
      const topicId = history.test?.topic?._id?.toString();

      // Группировка по предметам
      if (!subjectGroups[subjectId]) {
        subjectGroups[subjectId] = {
          subject: history.subject._id,
          tests: [],
          totalQuestions: 0,
          correctAnswers: 0,
          progressTrend: []
        };
      }
      subjectGroups[subjectId].tests.push(history);
      subjectGroups[subjectId].totalQuestions += history.total;
      subjectGroups[subjectId].correctAnswers += history.correct;
      subjectGroups[subjectId].progressTrend.push({
        date: history.date,
        score: history.resultPercent
      });

      // Группировка по темам
      if (topicId) {
        if (!topicGroups[topicId]) {
          topicGroups[topicId] = {
            topic: history.test.topic._id,
            subject: history.subject._id,
            tests: [],
            totalScore: 0
          };
        }
        topicGroups[topicId].tests.push(history);
        topicGroups[topicId].totalScore += history.resultPercent;
      }
    });

    // Формируем статистику по предметам
    const subjectStats = Object.values(subjectGroups).map(group => ({
      subject: group.subject,
      totalTests: group.tests.length,
      totalQuestions: group.totalQuestions,
      correctAnswers: group.correctAnswers,
      averageScore: Math.round(group.correctAnswers / group.totalQuestions * 100),
      lastTestDate: group.tests[group.tests.length - 1].date,
      progressTrend: group.progressTrend
    }));

    // Формируем слабые темы (средний балл ниже 60%)
    const weakTopics = Object.values(topicGroups)
      .filter(group => {
        const avgScore = group.totalScore / group.tests.length;
        return avgScore < 60;
      })
      .map(group => ({
        topic: group.topic,
        subject: group.subject,
        averageScore: Math.round(group.totalScore / group.tests.length),
        testCount: group.tests.length,
        lastTestDate: group.tests[group.tests.length - 1].date
      }))
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5); // Топ-5 самых слабых тем

    // Генерируем рекомендации
    const recommendations = await generateRecommendations(userId, weakTopics, subjectStats);

    // Сохраняем обновленную статистику
    await UserStatistics.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        subjectStats,
        weakTopics,
        recommendations,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

  } catch (error) {
    console.error('Ошибка обновления статистики:', error);
    throw error;
  }
}

/**
 * Генерировать рекомендации на основе статистики
 */
async function generateRecommendations(userId, weakTopics, subjectStats) {
  const recommendations = [];

  // Рекомендации по слабым темам
  for (const weakTopic of weakTopics.slice(0, 3)) {
    // Ищем тесты по этой теме
    const tests = await Test.find({ topic: weakTopic.topic })
      .sort({ createdAt: -1 })
      .limit(3);

    for (const test of tests) {
      recommendations.push({
        type: 'test',
        targetId: test._id,
        reason: `Повторите тему "${weakTopic.topic}" - ваш средний балл ${weakTopic.averageScore}%`,
        priority: 1
      });
    }
  }

  // Рекомендации по предметам с низким средним баллом
  const lowScoreSubjects = subjectStats.filter(stat => stat.averageScore < 70);
  
  for (const subjectStat of lowScoreSubjects.slice(0, 2)) {
    // Ищем темы по этому предмету
    const topics = await Topic.find({
      'subsection.subject': subjectStat.subject
    }).limit(3);

    for (const topic of topics) {
      recommendations.push({
        type: 'topic',
        targetId: topic._id,
        reason: `Улучшите знания по предмету "${subjectStat.subject}" - средний балл ${subjectStat.averageScore}%`,
        priority: 2
      });
    }
  }

  return recommendations.slice(0, 10); // Максимум 10 рекомендаций
}

/**
 * Обновить статистику после прохождения теста
 */
async function updateStatisticsAfterTest(req, res) {
  try {
    const userId = req.user._id;
    await updateUserStatistics(userId);
    
    res.json({
      success: true,
      message: 'Статистика обновлена'
    });
  } catch (error) {
    console.error('Ошибка обновления статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статистики',
      error: error.message
    });
  }
}

export {
  getUserStatistics,
  getProgressTrend,
  getRecommendations,
  updateUserStatistics,
  updateStatisticsAfterTest
}; 