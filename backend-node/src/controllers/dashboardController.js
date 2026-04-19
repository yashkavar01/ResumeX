const { Student, Resume, Skill, Job, HR_Profile, Job_Application } = require('../models');
const { runAiTask } = require('../services/resumeService');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.sub;
    const role = req.user.role;

    if (role === 'hr') {
      return res.json({ user_name: 'HR User', has_resume: false });
    }

    const student = await Student.findOne({ where: { userId } });
    if (!student) {
        return res.json({ user_name: 'Student', has_resume: false });
    }

    const resumes = await Resume.findAll({ 
        where: { studentId: student.id },
        include: [Skill],
        order: [['createdAt', 'DESC']],
        limit: 1
    });

    if (resumes.length > 0) {
        const r = resumes[0];
        const skills = r.Skills ? r.Skills.map(s => s.name) : [];
        return res.json({
             user_name: student.firstName, 
             has_resume: true,
             score: 87, 
             skills: skills
        });
    } else {
        return res.json({ user_name: student.firstName, has_resume: false });
    }
  } catch(error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

const getAvailableJobs = async (req, res) => {
  try {
      const userId = req.user.sub;
      const student = await Student.findOne({ where: { userId } });
      
      const jobs = await Job.findAll({
          include: [
              { model: Skill, attributes: ['name'] },
              { model: HR_Profile, attributes: ['companyName'] }
          ],
          order: [['createdAt', 'DESC']]
      });

      let appliedJobIds = [];
      if (student) {
          const applications = await Job_Application.findAll({
              where: { studentId: student.id },
              attributes: ['jobId']
          });
          appliedJobIds = applications.map(a => a.jobId);
      }

      const jobsWithStatus = jobs.map(job => {
          const jobJson = job.toJSON();
          jobJson.hasApplied = appliedJobIds.includes(job.id);
          return jobJson;
      });

      res.json({ data: jobsWithStatus });
  } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

const applyToJob = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const userId = req.user.sub;

        const student = await Student.findOne({ where: { userId } });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        // Check if already applied
        const existing = await Job_Application.findOne({
            where: { studentId: student.id, jobId }
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already applied for this job' });
        }

        const { caseStudyAnswer } = req.body;
        const application = await Job_Application.create({
            studentId: student.id,
            jobId,
            caseStudyAnswer
        });

        res.status(201).json({ message: 'Applied successfully', data: application });
    } catch (e) {
        console.error('Error applying to job:', e);
        res.status(500).json({ error: 'Failed to apply for job' });
    }
};

const tailorResumeForJob = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const userId = req.user.sub;

        // Fetch Student & Resume
        const student = await Student.findOne({ where: { userId } });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        const resumes = await Resume.findAll({
            where: { studentId: student.id },
            order: [['createdAt', 'DESC']],
            limit: 1
        });
        
        if (resumes.length === 0) {
            return res.status(404).json({ error: 'No resume found to tailor' });
        }

        const studentResumeText = resumes[0].textContent;

        // Fetch Target Job
        const targetJob = await Job.findByPk(jobId, { include: [Skill] });
        if (!targetJob) return res.status(404).json({ error: 'Job not found' });

        const jobSkills = targetJob.Skills ? targetJob.Skills.map(s => s.name).join(', ') : '';

        // Trigger AI
        let tailoredData = {};
        try {
            tailoredData = await runAiTask(prompt);
        } catch (err) {
            console.error('Error tailoring resume:', err.message);
            return res.status(500).json({ error: 'AI tailoring failed after multiple attempts.' });
        }

        res.json({
            message: 'Resume tailored successfully',
            data: tailoredData
        });

    } catch (error) {
        console.error('Error tailoring resume:', error);
        res.status(500).json({ error: 'Failed to tailor resume for job' });
    }
};

const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findByPk(id, {
            include: [
                { model: Skill, attributes: ['name'] },
                { model: HR_Profile, attributes: ['companyName'] }
            ]
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ data: job });
    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).json({ error: 'Failed to fetch job details' });
    }
};

module.exports = {
  getDashboard,
  getAvailableJobs,
  applyToJob,
  tailorResumeForJob,
  getJobById
};
