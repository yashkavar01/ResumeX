const { HR_Profile, User, Student, Resume, Job } = require('../models');

const getPendingHRs = async (req, res) => {
    try {
        const pendingHRs = await HR_Profile.findAll({
            where: { verificationStatus: 'pending' },
            include: [{
                model: User,
                attributes: ['id', 'email', 'createdAt']
            }]
        });
        
        res.json({ data: pendingHRs });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error fetching pending HRs' });
    }
};

const approveHR = async (req, res) => {
    try {
        const hrId = req.params.id;
        
        const hrProfile = await HR_Profile.findByPk(hrId);
        if (!hrProfile) {
            return res.status(404).json({ detail: 'HR Profile not found' });
        }

        hrProfile.verificationStatus = 'approved';
        await hrProfile.save();

        res.json({ message: 'HR account approved successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error approving HR' });
    }
};

const rejectHR = async (req, res) => {
    try {
        const hrId = req.params.id;
        
        const hrProfile = await HR_Profile.findByPk(hrId);
        if (!hrProfile) {
            return res.status(404).json({ detail: 'HR Profile not found' });
        }

        hrProfile.verificationStatus = 'rejected';
        await hrProfile.save();

        res.json({ message: 'HR account rejected' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error rejecting HR' });
    }
};

const getPlatformStats = async (req, res) => {
    try {
        const totalStudents = await Student.count();
        const activeHRs = await HR_Profile.count({ where: { verificationStatus: 'approved' } });
        const totalResumes = await Resume.count();
        const totalJobs = await Job.count();

        res.json({
            data: {
                totalStudents,
                activeHRs,
                totalResumes,
                totalJobs
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error fetching stats' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json({ data: users });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error fetching all users' });
    }
};

const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            include: [{
                model: HR_Profile,
                attributes: ['companyName']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ data: jobs });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error fetching all jobs' });
    }
};

module.exports = {
    getPendingHRs,
    approveHR,
    rejectHR,
    getPlatformStats,
    getAllUsers,
    getAllJobs
};
