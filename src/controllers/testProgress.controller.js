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
    console.error('Error in saveProgress:', error);
    res
      .status(500)
      .json({ message: 'Ошибка сохранения прогресса', error: error.message });
  }
};

// Get all in-progress tests for a user
export const getUserProgress = async (req, res) => {
  console.log('getUserProgress called');
  const userId = req.user.id;
  console.log('User ID:', userId);

  try {
    console.log('Fetching test progress for user:', userId);
    const progressList = await TestProgress.find({
      user: userId,
    }).populate({
      path: 'test',
      select: 'title questions',
    });

    console.log(
      'Progress list found:',
      progressList ? progressList.length : 0,
      'items'
    );

    if (!progressList) {
      console.log('No progress list found, returning empty array');
      return res.status(200).json([]);
    }

    const response = [];
    const testsToDelete = [];

    console.log('Processing progress items...');
    for (const p of progressList) {
      console.log('Processing progress item:', p._id);

      // Check if test exists and has questions
      if (!p.test || !p.test.questions) {
        console.log('Test is null or has no questions, marking for deletion');
        testsToDelete.push(p._id);
        continue;
      }

      const totalQuestions = p.test.questions.length;
      console.log('Total questions:', totalQuestions);

      if (totalQuestions === 0) {
        console.log('No questions in test, marking for deletion');
        testsToDelete.push(p._id);
        continue;
      }

      const progress = Math.floor((p.answers.length / totalQuestions) * 100);
      console.log('Progress percentage:', progress);

      // Delete if completed (100% progress) OR if status is completed
      if (progress >= 100 || p.status === 'completed') {
        console.log('Test completed, marking for deletion');
        testsToDelete.push(p._id);
        continue;
      }

      console.log('Adding to response:', p.test.title);
      response.push({
        testId: p.test._id,
        title: p.test.title,
        progress,
        timeLeft: p.timeLeft,
        currentQuestionIndex: p.currentQuestionIndex,
        status: p.status,
      });
    }

    console.log('Tests to delete:', testsToDelete.length);
    if (testsToDelete.length > 0) {
      console.log('Deleting completed tests...');
      await TestProgress.deleteMany({
        _id: { $in: testsToDelete },
      });
    }

    console.log('Sending response with', response.length, 'items');
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getUserProgress:', error);
    res
      .status(500)
      .json({ message: 'Ошибка получения прогресса', error: error.message });
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

    // Check if test exists and has questions
    if (!progress.test || !progress.test.questions) {
      await TestProgress.findByIdAndDelete(progress._id);
      return res
        .status(404)
        .json({ message: 'Test not found, progress has been removed' });
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
    console.error('Error in getSpecificTestProgress:', error);
    res
      .status(500)
      .json({ message: 'Error fetching test progress', error: error.message });
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
    console.error('Error in deleteProgress:', error);
    res
      .status(500)
      .json({ message: 'Error deleting progress', error: error.message });
  }
};
