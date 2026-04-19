const { User, Student, HR_Profile } = require('../models');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        
        const user = await User.findByPk(userId, {
            attributes: ['email', 'role']
        });
        
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        if (user.role === 'hr') {
            const hrProfile = await HR_Profile.findOne({ where: { userId } });
            
            if (!hrProfile) {
                return res.status(404).json({ detail: 'HR Profile not found' });
            }

            return res.json({
                email: user.email,
                role: user.role,
                profile: hrProfile
            });
        } else {
            // Student flow (default)
            const { Resume } = require('../models');
            const student = await Student.findOne({ 
                where: { userId },
                include: [{
                    model: Resume,
                    attributes: ['id', 'filename', 'createdAt'],
                    order: [['createdAt', 'DESC']]
                }]
            });

            if (!student) {
                return res.status(404).json({ detail: 'Student Profile not found' });
            }

            return res.json({
                email: user.email,
                role: user.role,
                profile: student,
                resumes: student.Resumes || []
            });
        }
    } catch(e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        if (user.role === 'hr') {
            const hrProfile = await HR_Profile.findOne({ where: { userId } });
            if (!hrProfile) return res.status(404).json({ detail: 'HR Profile not found' });

            const allowedFields = [
                'firstName', 'lastName', 'phone', 'location', 'bio',
                'companyName', 'position', 'linkedInUrl'
            ];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    hrProfile[field] = req.body[field];
                }
            });

            await hrProfile.save();
            return res.json({ message: 'HR Profile updated successfully', profile: hrProfile });

        } else {
            // Student flow
            const student = await Student.findOne({ where: { userId } });
            if (!student) return res.status(404).json({ detail: 'Student Profile not found' });

            const allowedFields = [
                'firstName', 'lastName', 'phone', 'location', 
                'qualification', 'university', 'bio', 
                'githubUrl', 'linkedinUrl', 'portfolioUrl', 
                'experienceYears', 'expectedSalary'
            ];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    student[field] = req.body[field];
                }
            });

            await student.save();
            return res.json({ message: 'Student Profile updated successfully', profile: student });
        }
    } catch(e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error updating profile' });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Deleting the user will trigger cascading deletions for:
        // Student/HR_Profile, Resumes, Notifications, Job_Matches, Job_Applications, etc.
        // based on the associations updated in models/index.js
        await user.destroy();
        
        res.json({ message: 'Account deleted successfully' });
    } catch(e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error deleting account' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    deleteProfile
};
