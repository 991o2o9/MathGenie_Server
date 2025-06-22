import TestProgress from '../models/testProgress.model.js';
import Test from '../models/test.model.js';

export const saveProgress = async (req, res) => {
  const { testId, currentQuestionIndex, answers, timeLeft } = req.body;
  const userId = req.user.id;

  if (!testId) {
    return res.status(400).json({ message: 'testId is required' });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    const totalQuestions = test.questions.length;
    const answeredCount = answers ? answers.length : 0;
    const status =
      totalQuestions > 0 && answeredCount >= totalQuestions
        ? 'completed'
        : 'in_progress';

    if (status === 'completed') {
      await TestProgress.findOneAndDelete({
        user: userId,
        test: testId,
      });
      return res.status(200).json({
        message: 'Тест завершен, прогресс удален',
        status: 'completed',
        completed: true,
      });
    }

    const progress = await TestProgress.findOneAndUpdate(
      { user: userId, test: testId },
      {
        user: userId,
        test: testId,
        currentQuestionIndex,
        answers,
        timeLeft,
        status,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сохранения прогресса', error });
  }
};

// Get all in-progress tests for a user
export const getUserProgress = async (req, res) => {
  const userId = req.user.id;

  try {
    const progressList = await TestProgress.find({
      user: userId,
    }).populate({
      path: 'test',
      select: 'title questions',
    });

    if (!progressList) {
      return res.status(200).json([]);
    }

    const response = [];
    const testsToDelete = [];

    for (const p of progressList) {
      const totalQuestions = p.test.questions.length;
      if (totalQuestions === 0) {
        testsToDelete.push(p._id);
        continue;
      }

      const progress = Math.floor((p.answers.length / totalQuestions) * 100);

      // Delete if completed (100% progress) OR if status is completed
      if (progress >= 100 || p.status === 'completed') {
        testsToDelete.push(p._id);
        continue;
      }

      response.push({
        testId: p.test._id,
        title: p.test.title,
        progress,
        timeLeft: p.timeLeft,
        currentQuestionIndex: p.currentQuestionIndex,
        status: p.status,
      });
    }

    if (testsToDelete.length > 0) {
      await TestProgress.deleteMany({
        _id: { $in: testsToDelete },
      });
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения прогресса', error });
  }
};

export const getSpecificTestProgress = async (req, res) => {
  const { testId } = req.params;
  const userId = req.user.id;

  try {
    const progress = await TestProgress.findOne({
      user: userId,
      test: testId,
    }).populate('test', 'title questions timeLimit');

    if (!progress) {
      return res.status(404).json({ message: 'No test progress found' });
    }

    // Check if test is completed and delete if so
    const totalQuestions = progress.test.questions.length;
    const progressPercentage =
      totalQuestions > 0
        ? Math.floor((progress.answers.length / totalQuestions) * 100)
        : 0;

    if (progressPercentage >= 100 || progress.status === 'completed') {
      await TestProgress.findByIdAndDelete(progress._id);
      return res
        .status(404)
        .json({ message: 'Test is completed and progress has been removed' });
    }

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test progress', error });
  }
};

export const deleteProgress = async (req, res) => {
  const { testId } = req.params;
  const userId = req.user.id;

  try {
    const result = await TestProgress.findOneAndDelete({
      user: userId,
      test: testId,
    });
    if (!result) {
      return res.status(404).json({ message: 'Progress not found to delete' });
    }
    res.status(200).json({ message: 'Progress deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting progress', error });
  }
};
