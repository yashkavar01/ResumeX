const { Job, HR_Profile, Skill, Student, Resume, Job_Application, Notification } = require('../models');
const { Op } = require('sequelize');
const { runAiTask } = require('../services/resumeService');

const postJob = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { title, description, required_skills, caseStudyQuestion } = req.body;
        console.log('Post Job Request Received:', { title, caseStudyQuestion });

        if (!title || !required_skills || !Array.isArray(required_skills)) {
            return res.status(400).json({ detail: 'Missing title or required_skills array' });
        }

        const hrProfile = await HR_Profile.findOne({ where: { userId } });
        if (!hrProfile || hrProfile.verificationStatus !== 'approved') {
            return res.status(403).json({ detail: 'Only approved HRs can post jobs' });
        }

        const job = await Job.create({
            title,
            description,
            caseStudyQuestion,
            hrId: hrProfile.id
        });

        // Map and associate skills safely
        for (const skillName of required_skills) {
            const [skillRec] = await Skill.findOrCreate({ where: { name: skillName } });
            await job.addSkill(skillRec);
        }

        res.status(201).json({ message: 'Job posted successfully', data: job });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server error posting job' });
    }
};

const getMyJobs = async (req, res) => {
    try {
        const userId = req.user.sub;
        
        const hrProfile = await HR_Profile.findOne({ where: { userId } });
        if (!hrProfile) {
            return res.status(403).json({ detail: 'HR Profile not found' });
        }

        const jobs = await Job.findAll({
            where: { hrId: hrProfile.id },
            include: [{ model: Skill, attributes: ['name'] }]
        });

        res.json({ data: jobs });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server error fetching jobs' });
    }
};

const searchTalent = async (req, res) => {
    try {
        const { minScore, skill } = req.query;
        
        let resumeWhere = {};
        if (minScore) {
            resumeWhere.atsScore = { [Op.gte]: parseInt(minScore) };
        }

        let skillInclude = {
            model: Skill,
            attributes: ['name']
        };

        if (skill) {
            skillInclude.where = { name: { [Op.like]: `%${skill}%` } };
        }

        const resumes = await Resume.findAll({
            where: resumeWhere,
            include: [
                skillInclude,
                { 
                    model: Student, 
                    attributes: ['id', 'school', 'degree', 'graduationYear'] 
                }
            ],
            order: [['atsScore', 'DESC']]
        });

        res.json({ data: resumes });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server error searching talent' });
    }
};

const getJobApplicants = async (req, res) => {
    try {
        const userId = req.user.sub;
        const hrProfile = await HR_Profile.findOne({ where: { userId } });
        if (!hrProfile) return res.status(404).json({ detail: 'HR profile not found' });

        const applicants = await Job_Application.findAll({
            include: [
                {
                    model: Job,
                    where: { hrId: hrProfile.id },
                    attributes: ['title']
                },
                {
                    model: Student,
                    attributes: ['firstName', 'lastName', 'university', 'qualification']
                }
            ],
            where: { status: 'pending' },
            order: [['createdAt', 'DESC']]
        });

        res.json({ data: applicants });
    } catch (e) {
        console.error('Error fetching applicants:', e);
        res.status(500).json({ detail: 'Failed to fetch applicants' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'shortlisted' or 'rejected'
        const userId = req.user.sub;

        const hrProfile = await HR_Profile.findOne({ where: { userId } });
        if (!hrProfile) return res.status(404).json({ detail: 'HR profile not found' });

        const application = await Job_Application.findByPk(id, {
            include: [{ model: Job }]
        });

        if (!application) return res.status(404).json({ detail: 'Application not found' });
        if (application.Job.hrId !== hrProfile.id) {
            return res.status(403).json({ detail: 'Unauthorized to manage this application' });
        }

        application.status = status;
        await application.save();

        // Create Notification for Student
        try {
            console.log(`Developing notification for studentId: ${application.studentId}, status: ${status}`);
            const student = await Student.findByPk(application.studentId);
            if (student) {
                const studentName = student.firstName || 'Candidate';
                const jobTitle = application.Job ? application.Job.title : 'the position';
                const companyName = hrProfile.companyName || 'the company';

                const title = status === 'shortlisted' ? `🎉 Application Shortlisted - ${jobTitle}` : `📝 Update regarding your application - ${jobTitle}`;
                const message = status === 'shortlisted'
                    ? `Dear ${studentName}, We are pleased to inform you that your application for the ${jobTitle} position at ${companyName} has been shortlisted. Our recruitment team will reach out to you shortly regarding the next steps. Congratulations on reaching this stage!`
                    : `Dear ${studentName}, Thank you for your interest in the ${jobTitle} position at ${companyName}. After careful review, we have decided to move forward with other candidates who more closely match our current requirements. We appreciate the time you invested in your application and wish you the best in your career.`;
                const type = status === 'shortlisted' ? 'success' : 'info';

                const notif = await Notification.create({
                    userId: student.userId,
                    title,
                    message,
                    type
                });
                console.log(`Notification created successfully: ID ${notif.id} for userId ${student.userId}`);
            } else {
                console.log(`Student not found for studentId: ${application.studentId}`);
            }
        } catch (notifErr) {
            console.error('Failed to create notification inside updateApplicationStatus:', notifErr);
        }

        res.json({ message: `Application ${status} successfully`, data: application });
    } catch (e) {
        console.error('Error updating application status:', e);
        res.status(500).json({ detail: 'Failed to update application status' });
    }
};

const getShortlistedCandidates = async (req, res) => {
    try {
        const userId = req.user.sub;
        const hrProfile = await HR_Profile.findOne({ where: { userId } });
        if (!hrProfile) return res.status(404).json({ detail: 'HR profile not found' });

        const shortlisted = await Job_Application.findAll({
            include: [
                {
                    model: Job,
                    where: { hrId: hrProfile.id },
                    attributes: ['title']
                },
                {
                    model: Student,
                    attributes: ['firstName', 'lastName', 'university', 'qualification', 'userId']
                }
            ],
            where: { status: 'shortlisted' },
            order: [['updatedAt', 'DESC']]
        });

        res.json({ data: shortlisted });
    } catch (e) {
        console.error('Error fetching shortlisted candidates:', e);
        res.status(500).json({ detail: 'Failed to fetch shortlisted candidates' });
    }
};

const getTopCandidatesForJob = async (req, res) => {
    try {
        const jobId = req.params.jobId;

        const job = await Job.findByPk(jobId, { include: [Skill] });
        if (!job) {
            return res.status(404).json({ detail: 'Job not found' });
        }

        const jobSkills = job.Skills.map(s => s.name.toLowerCase());

        const resumes = await Resume.findAll({
            include: [
                { model: Skill },
                { model: Student, attributes: ['id'] }
            ]
        });

        const preFiltered = resumes.filter(resume => {
            const resumeSkills = resume.Skills.map(s => s.name.toLowerCase());
            return resumeSkills.some(skill => jobSkills.includes(skill));
        });

        if (preFiltered.length === 0) {
            return res.json({ data: [] });
        }

        const studentPayloads = preFiltered.map(r => ({
            studentId: r.studentId,
            resume_text: r.textContent,
            ats_score: r.atsScore
        }));

        let topCandidates = [];
        try {
            const prompt = `Rank these candidates for ${job.title}...`; // placeholder or original
            topCandidates = await runAiTask(prompt);
        } catch (err) {
            console.error('Error running AI matchmaker:', err.message);
            return res.status(500).json({ detail: 'AI matchmaking failed after multiple attempts.' });
        }

        res.json({
            message: 'AI Matchmaker run successfully',
            data: topCandidates
        });

    } catch (e) {
        console.error('Error running AI matchmaker:', e);
        res.status(500).json({ detail: 'Failed to evaluate top candidates' });
    }
};

module.exports = {
    postJob,
    getMyJobs,
    searchTalent,
    getTopCandidatesForJob,
    getJobApplicants,
    updateApplicationStatus,
    getShortlistedCandidates
};
