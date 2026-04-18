const { User, Student } = require('../models');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        
        const user = await User.findByPk(userId, {
            attributes: ['email', 'role']
        });
        
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

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
            return res.status(404).json({ detail: 'Profile not found' });
        }

        res.json({
            email: user.email,
            role: user.role,
            profile: student,
            resumes: student.Resumes || []
        });
    } catch(e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.sub;
        const student = await Student.findOne({ where: { userId } });
        
        if (!student) {
            return res.status(404).json({ detail: 'Profile not found' });
        }

        // List of allowed fields to update
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
        res.json({ message: 'Profile updated successfully', profile: student });
    } catch(e) {
        console.error(e);
        res.status(500).json({ detail: 'Server Error updating profile' });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
