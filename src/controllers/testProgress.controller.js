import TestProgress from '../models/testProgress.model.js';
import Test from '../models/test.model.js';

// Save or update test progress
export const saveProgress = async (req, res) => {
  const { testId, currentQuestionIndex, answers, timeLeft } = req.body;
  const userId = req.user.id; // from authMiddleware

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
      status: 'in_progress',
    }).populate({
      path: 'test',
      select: 'title questions',
    });

    if (!progressList) {
      return res.status(200).json([]);
    }

    const response = progressList
      .map((p) => {
        const totalQuestions = p.test.questions.length;
        // Avoid division by zero and handle tests with no questions
        if (totalQuestions === 0) {
          return null;
        }
        const progress = Math.floor((p.answers.length / totalQuestions) * 100);

        // Filter out completed tests that might still have "in_progress" status
        if (progress >= 100) {
          return null;
        }

        return {
          testId: p.test._id,
          title: p.test.title,
          progress,
          timeLeft: p.timeLeft,
          currentQuestionIndex: p.currentQuestionIndex,
          status: p.status,
        };
      })
      .filter(Boolean); // Removes null entries

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения прогресса', error });
  }
};

// Get progress for a specific test
export const getSpecificTestProgress = async (req, res) => {
  const { testId } = req.params;
  const userId = req.user.id;

  try {
    const progress = await TestProgress.findOne({
      user: userId,
      test: testId,
      status: 'in_progress',
    }).populate('test', 'title questions timeLimit');
    if (!progress) {
      return res.status(404).json({ message: 'No in-progress test found' });
    }
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test progress', error });
  }
};

// Delete test progress
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
