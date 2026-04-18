const { User, HR_Profile } = require('./src/models');
const bcrypt = require('bcrypt');

async function seed() {
  const hashedPassword = await bcrypt.hash('hr123', 10);
  const user = await User.create({ email: 'test_hr@resumex.com', password: hashedPassword, role: 'hr' });
  await HR_Profile.create({
    userId: user.id,
    companyName: 'OpenAI',
    position: 'Technical Recruiter',
    linkedInUrl: 'https://www.linkedin.com/company/openai/',
    verificationStatus: 'pending'
  });
  console.log('Seed successful. You can now see this HR in the Admin Dashboard.');
}

seed().then(() => process.exit());
