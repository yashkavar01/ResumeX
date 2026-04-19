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

const { sendOTPEmail } = require('../services/emailService');

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ detail: 'User with this email not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetOTP = otp;
        user.resetOTPExpires = otpExpires;
        await user.save();

        // Send Email
        await sendOTPEmail(email, otp);

        res.json({ message: 'OTP sent to your email' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Failed to send OTP' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ where: { email, resetOTP: otp } });

        if (!user || user.resetOTPExpires < new Date()) {
            return res.status(400).json({ detail: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Verification failed' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ where: { email, resetOTP: otp } });

        if (!user || user.resetOTPExpires < new Date()) {
            return res.status(400).json({ detail: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOTP = null;
        user.resetOTPExpires = null;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: 'Password reset failed' });
    }
};

module.exports = { register, login, forgotPassword, verifyOTP, resetPassword };
