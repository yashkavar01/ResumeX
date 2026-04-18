const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Student, HR_Profile } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey12345';

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create User
    const user = await User.create({ email, password: hashedPassword, role });
    
    // Create Profile mapping based on role
    try {
      if (role === 'student') { 
        const names = name ? name.split(' ') : ['User'];
        await Student.create({
          userId: user.id,
          firstName: names[0],
          lastName: names.slice(1).join(' ') || ''
        });
      } else if (role === 'hr') {
        const { companyName, linkedInUrl, position } = req.body;
        await HR_Profile.create({
          userId: user.id,
          companyName: companyName || 'Default Company',
          linkedInUrl: linkedInUrl || null,
          position: position || null,
          verificationStatus: 'pending'
        });
      }
    } catch (profileError) {
      console.error('Profile creation failed:', profileError);
      // Optional: Delete user if profile creation fails to maintain consistency
      // await user.destroy(); 
      return res.status(500).json({ detail: 'Account created, but profile setup failed. Please contact support.' });
    }
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ detail: 'Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if(!username || !password){
        return res.status(400).json({ detail: 'Missing username or password' });
    }

    const user = await User.findOne({ where: { email: username } });
    if (!user) {
      return res.status(400).json({ detail: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ detail: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    let profileData = {};
    if (user.role === 'student') {
      const student = await Student.findOne({ where: { userId: user.id } });
      if (student) profileData.name = student.firstName + ' ' + student.lastName;
    } else if (user.role === 'admin') {
      profileData.name = 'Admin';
    } else if (user.role === 'hr') {
        const hrProfile = await HR_Profile.findOne({ where: { userId: user.id } });
        console.log(`[AUTH] Checking HR Approval for ${user.email}. Status: ${hrProfile ? hrProfile.verificationStatus : 'No Profile'}`);
        if (hrProfile && String(hrProfile.verificationStatus).toLowerCase() !== 'approved') {
            return res.status(403).json({ detail: `Your HR account is status: ${hrProfile.verificationStatus}` });
        }
        profileData.name = hrProfile ? hrProfile.companyName + ' Representative' : 'HR Representative';
    }

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profileData.name || 'User'
      }
    });

  } catch(e) {
    console.error(e);
    res.status(500).json({ detail: 'Server Error' });
  }
};

module.exports = { register, login };
