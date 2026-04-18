const { User, HR_Profile } = require('./src/models');

async function debugLoginIssue() {
  const email = 'google@gmail.com';
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    console.log('User not found: ', email);
    return;
  }
  
  console.log('User ID:', user.id, 'Role:', user.role);
  
  const hrProfile = await HR_Profile.findOne({ where: { userId: user.id } });
  if (!hrProfile) {
    console.log('HR Profile NOT FOUND for User ID:', user.id);
  } else {
    console.log('HR Profile:', {
      id: hrProfile.id,
      companyName: hrProfile.companyName,
      verificationStatus: hrProfile.verificationStatus
    });
  }
}

debugLoginIssue().then(() => process.exit());
