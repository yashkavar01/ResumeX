require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { sequelize } = require('./src/models');
const resumeController = require('./src/controllers/resumeController');
const recommendationController = require('./src/controllers/recommendationController');
const authController = require('./src/controllers/authController');
const dashboardController = require('./src/controllers/dashboardController');
const adminController = require('./src/controllers/adminController');
const profileController = require('./src/controllers/profileController');
const hrController = require('./src/controllers/hrController');
const notificationController = require('./src/controllers/notificationController');
const authMiddleware = require('./src/middleware/auth');
const adminMiddleware = require('./src/middleware/admin');

const app = express();
const PORT = process.env.PORT || 8005;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Set up Multer for handling multipart/form-data
const upload = multer({ dest: 'uploads/' });

// Public API Endpoints
app.get('/ping', (req, res) => res.send('pong'));
app.post('/register', authController.register);
app.post('/login', upload.none(), authController.login); // Multer `.none()` parses FormData texts

// Protected API Endpoints
app.get('/dashboard', authMiddleware, dashboardController.getDashboard);
app.get('/student/jobs', authMiddleware, dashboardController.getAvailableJobs);
app.post('/student/apply/:jobId', authMiddleware, dashboardController.applyToJob);
app.post('/student/tailor-resume/:jobId', authMiddleware, dashboardController.tailorResumeForJob);
app.post('/analyze', authMiddleware, upload.single('resume'), resumeController.analyzeResume);
app.delete('/resume/:id', authMiddleware, resumeController.deleteResume);
app.post('/optimize', authMiddleware, resumeController.optimizeResume);
app.get('/recommendations/:studentId', authMiddleware, recommendationController.recommendJobs);

// Profile Endpoints
app.get('/profile', authMiddleware, profileController.getProfile);
app.put('/profile', authMiddleware, profileController.updateProfile);

// Notifications
app.get('/notifications', authMiddleware, notificationController.getNotifications);
app.post('/notifications/:id/read', authMiddleware, notificationController.markAsRead);

// Admin Endpoints
app.get('/admin/pending-hrs', authMiddleware, adminMiddleware, adminController.getPendingHRs);
app.post('/admin/approve-hr/:id', authMiddleware, adminMiddleware, adminController.approveHR);
app.post('/admin/reject-hr/:id', authMiddleware, adminMiddleware, adminController.rejectHR);
app.get('/admin/stats', authMiddleware, adminMiddleware, adminController.getPlatformStats);
app.get('/admin/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
app.get('/admin/jobs', authMiddleware, adminMiddleware, adminController.getAllJobs);

// HR Endpoints
app.post('/hr/jobs', authMiddleware, hrController.postJob);
app.get('/hr/my-jobs', authMiddleware, hrController.getMyJobs);
app.get('/hr/talent', authMiddleware, hrController.searchTalent);
app.get('/hr/top-candidates/:jobId', authMiddleware, hrController.getTopCandidatesForJob);
app.get('/hr/applicants', authMiddleware, hrController.getJobApplicants);
app.post('/hr/applications/:id/status', authMiddleware, hrController.updateApplicationStatus);
app.get('/hr/shortlisted', authMiddleware, hrController.getShortlistedCandidates);

// Database Sync and Server Start
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err);
  });
