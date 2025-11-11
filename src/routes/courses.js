const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

module.exports = (Customer, Review, Certificate) => {
  router.post('/enroll', requireAuth, async (req, res) => {
    try {
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: 'Missing courseId' });
      }

      const customer = await Customer.findOneAndUpdate(
        { userId: req.session.userId },
        { $addToSet: { enrolledCourses: courseId } },
        { new: true, upsert: true }
      );

      res.json({ message: 'Enrolled', enrolledCourses: customer.enrolledCourses });
    } catch (error) {
      console.error('Enroll error:', error);
      res.status(500).json({ message: 'Error' });
    }
  });

  router.post('/unenroll', requireAuth, async (req, res) => {
    try {
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: 'Missing courseId' });
      }

      await Customer.findOneAndUpdate(
        { userId: req.session.userId },
        { $pull: { enrolledCourses: courseId } },
        { new: true }
      );

      res.json({ message: 'Unenrolled successfully' });
    } catch (error) {
      console.error('Unenroll error:', error);
      res.status(500).json({ message: 'Error during unenrollment' });
    }
  });

  router.get('/enrolled', requireAuth, async (req, res) => {
    try {
      const customer = await Customer.findOne({ userId: req.session.userId });
      res.json({ enrolledCourses: customer?.enrolledCourses || [] });
    } catch (error) {
      console.error('Get enrolled error:', error);
      res.status(500).json({ message: 'Error' });
    }
  });

  router.get('/progress/:courseId', requireAuth, async (req, res) => {
    try {
      const customer = await Customer.findOne({ userId: req.session.userId });
      const progress = (customer?.progress && customer.progress[req.params.courseId]) || null;
      res.json({ progress });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching progress' });
    }
  });

  router.post('/progress/save', requireAuth, async (req, res) => {
    try {
      const { courseId, lastLessonId, lastPosition } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: 'Missing courseId' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const progress = customer.progress || {};
      progress[courseId] = {
        lastLessonId: lastLessonId || 'main',
        lastPosition: Number(lastPosition) || 0,
        updatedAt: new Date()
      };
      customer.progress = progress;
      await customer.save();

      res.json({ message: 'Progress saved', progress: progress[courseId] });
    } catch (error) {
      res.status(500).json({ message: 'Error saving progress' });
    }
  });

  router.post('/progress/complete-lesson', requireAuth, async (req, res) => {
    try {
      const { courseId, lessonId } = req.body;
      if (!courseId || !lessonId) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const progress = customer.progress || {};
      const courseProgress = progress[courseId] || {};
      const completedSet = new Set(courseProgress.completedLessons || []);
      completedSet.add(String(lessonId));
      courseProgress.completedLessons = Array.from(completedSet);
      courseProgress.updatedAt = new Date();
      progress[courseId] = courseProgress;
      customer.progress = progress;
      await customer.save();

      res.json({ completedLessons: courseProgress.completedLessons });
    } catch (error) {
      res.status(500).json({ message: 'Error completing lesson' });
    }
  });

  router.post('/progress/uncomplete-lesson', requireAuth, async (req, res) => {
    try {
      const { courseId, lessonId } = req.body;
      if (!courseId || !lessonId) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const progress = customer.progress || {};
      const courseProgress = progress[courseId] || {};
      const completedArray = Array.from(new Set(courseProgress.completedLessons || []));
      const index = completedArray.indexOf(String(lessonId));
      
      if (index !== -1) {
        completedArray.splice(index, 1);
      }
      
      courseProgress.completedLessons = completedArray;
      courseProgress.updatedAt = new Date();
      progress[courseId] = courseProgress;
      customer.progress = progress;
      await customer.save();

      res.json({ completedLessons: courseProgress.completedLessons });
    } catch (error) {
      res.status(500).json({ message: 'Error updating lesson' });
    }
  });

  router.post('/progress/bookmark', requireAuth, async (req, res) => {
    try {
      const { courseId, note, position } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: 'Missing courseId' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const progress = customer.progress || {};
      const courseProgress = progress[courseId] || {};
      courseProgress.bookmarks = courseProgress.bookmarks || [];
      courseProgress.bookmarks.push({
        note: String(note || 'Bookmark'),
        position: Number(position) || 0,
        at: new Date()
      });
      courseProgress.updatedAt = new Date();
      progress[courseId] = courseProgress;
      customer.progress = progress;
      await customer.save();

      res.json({ bookmarks: courseProgress.bookmarks });
    } catch (error) {
      res.status(500).json({ message: 'Error adding bookmark' });
    }
  });

  router.get('/:courseId', async (req, res) => {
    try {
      const reviews = await Review.find({ courseId: req.params.courseId })
        .sort({ createdAt: -1 })
        .limit(50);
      res.json({ reviews });
    } catch (error) {
      console.error(' Error fetching reviews:', error);
      res.status(500).json({ message: 'Error fetching reviews' });
    }
  });

  router.get('/:courseId/summary', async (req, res) => {
    try {
      const aggregation = await Review.aggregate([
        { $match: { courseId: req.params.courseId } },
        { $group: { _id: '$courseId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      
      const summary = aggregation[0] || { avg: 0, count: 0 };
      res.json({ avg: Number(summary.avg || 0).toFixed(1), count: summary.count || 0 });
    } catch (error) {
      console.error(' Error fetching review summary:', error);
      res.status(500).json({ message: 'Error fetching summary' });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    try {
      const { courseId, rating, comment } = req.body;
      console.log('⭐ Review submission:', { courseId, rating, userId: req.session.userId });
      
      if (!courseId || !rating) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer || !(customer.enrolledCourses || []).includes(courseId)) {
        console.log(' Not enrolled for review:', { courseId, enrolled: customer?.enrolledCourses });
        return res.status(403).json({ message: 'Enroll to review' });
      }

      const review = await Review.create({
        userId: req.session.userId,
        username: req.session.username,
        courseId,
        rating: Number(rating),
        comment: String(comment || '')
      });

      console.log('✅ Review added successfully:', { courseId, rating });
      res.json({ message: 'Review added', review });
    } catch (error) {
      console.error(' Review submission error:', error);
      res.status(500).json({ message: 'Error adding review', error: error.message });
    }
  });

  router.post('/submit', requireAuth, async (req, res) => {
    try {
      const { courseId, score, total } = req.body;
      console.log('📝 Quiz submission:', { courseId, score, total, userId: req.session.userId });
      
      if (!courseId || total == null || score == null) {
        return res.status(400).json({ message: 'Missing fields' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer) {
        console.error(' Customer not found for user:', req.session.userId);
        return res.status(404).json({ message: 'Customer not found' });
      }

      const progress = customer.progress || {};
      const courseProgress = progress[courseId] || {};
      const passed = Number(score) / Number(total) >= 0.7;
      
      courseProgress.quiz = {
        score: Number(score),
        total: Number(total),
        passed,
        at: new Date()
      };
      progress[courseId] = courseProgress;
      customer.progress = progress;
      await customer.save();

      console.log('✅ Quiz saved successfully. Passed:', passed);
      res.json({ passed, quiz: courseProgress.quiz });
    } catch (error) {
      console.error(' Quiz submission error:', error);
      res.status(500).json({ message: 'Error saving quiz', error: error.message });
    }
  });

  const generateCode = () => {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  };

  router.post('/issue', requireAuth, async (req, res) => {
    try {
      const { courseId, score, total } = req.body;
      console.log('🎓 Certificate request:', { courseId, score, total, userId: req.session.userId });
      
      if (!courseId) {
        return res.status(400).json({ message: 'Missing courseId' });
      }

      const customer = await Customer.findOne({ userId: req.session.userId });
      if (!customer || !(customer.enrolledCourses || []).includes(courseId)) {
        console.log(' Not enrolled:', { courseId, enrolled: customer?.enrolledCourses });
        return res.status(403).json({ message: 'Enroll to get certificate' });
      }

      const progress = customer.progress || {};
      const courseProgress = progress[courseId] || {};

      if (score != null && total != null) {
        const passed = Number(score) / Number(total) >= 0.7;
        courseProgress.quiz = {
          score: Number(score),
          total: Number(total),
          passed,
          at: new Date()
        };
        progress[courseId] = courseProgress;
        customer.progress = progress;
        await customer.save();
        
        if (!passed) {
          console.log(' Quiz not passed:', { score, total });
          return res.status(400).json({ message: 'Pass the quiz first' });
        }
      } else {
        if (!courseProgress.quiz || !courseProgress.quiz.passed) {
          console.log('❌ No passing quiz found');
          return res.status(400).json({ message: 'Pass the quiz first' });
        }
      }

      const code = generateCode();
      const certificate = await Certificate.create({
        code,
        userId: customer.userId,
        username: customer.username,
        courseId
      });

      console.log('✅ Certificate issued successfully. Code:', code);
      res.json({ code, certificate });
    } catch (error) {
      console.error(' Certificate issuance error:', error);
      res.status(500).json({ message: 'Error issuing certificate', error: error.message });
    }
  });

  router.get('/:code', async (req, res) => {
    try {
      const code = req.params.code;
      console.log('🔍 Certificate lookup:', code);
      
      const certificate = await Certificate.findOne({ code: code });
      
      if (!certificate) {
        console.log('❌ Certificate not found:', code);
        return res.status(404).json({ message: 'Certificate not found' });
      }
      
      console.log('✅ Certificate found:', { code, username: certificate.username, courseId: certificate.courseId });
      res.json({ certificate });
    } catch (error) {
      console.error('❌ Certificate fetch error:', error);
      res.status(500).json({ message: 'Error fetching certificate', error: error.message });
    }
  });

  return router;
};
