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
    const progress = await TestProgress.findOneAndUpdate(
      { user: userId, test: testId },
      {
        user: userId,
        test: testId,
        currentQuestionIndex,
        answers,
        timeLeft,
        status: 'in_progress',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error saving progress', error });
  }
};

// Get all in-progress tests for a user
export const getUserProgress = async (req, res) => {
  const { userId } = req.params;

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

    const response = progressList.map((p) => {
      const totalQuestions = p.test.questions.length;
      const progress =
        totalQuestions > 0
          ? Math.floor((p.answers.length / totalQuestions) * 100)
          : 0;

      return {
        testId: p.test._id,
        title: p.test.title,
        progress,
        timeLeft: p.timeLeft,
        currentQuestionIndex: p.currentQuestionIndex,
        status: p.status,
      };
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user progress', error });
  }
};

// Get progress for a specific test
export const getSpecificTestProgress = async (req, res) => {
  const { userId, testId } = req.params;

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
  const { userId, testId } = req.params;

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
