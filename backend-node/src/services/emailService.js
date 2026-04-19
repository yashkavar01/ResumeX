const nodemailer = require('nodemailer');

const sendOTPEmail = async (toEmail, otp) => {
    // Configure transporter
    // For Production: Use service like Gmail with App Password
    // For Debugging: If credentials are missing, we log to console
    
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    const isPlaceholder = !user || !pass || user.includes('your-email') || pass.includes('your-16-character');

    if (isPlaceholder) {
        console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set correctly. Falling back to console logging for OTP.');
        console.log(`\n----------------------------------------------`);
        console.log(`📧 [Simulated Email to ${toEmail}]`);
        console.log(`Your ResumeX Password Reset OTP is: ${otp}`);
        console.log(`----------------------------------------------\n`);
        return true;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587
        auth: {
            user: user,
            pass: pass
        }
    });

    const mailOptions = {
        from: `"ResumeX Support" <${user}>`,
        to: toEmail,
        subject: 'ResumeX Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
                <h2 style="color: #6366f1; text-align: center;">ResumeX Password Reset</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your ResumeX account. Please use the One-Time Password (OTP) below to continue:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #e2e8f0; padding: 10px 20px; border-radius: 8px;">${otp}</span>
                </div>
                <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2025 ResumeX Intelligence Platform</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP Email sent successfully to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw error;
    }
};

module.exports = { sendOTPEmail };
