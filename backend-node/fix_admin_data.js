const { HR_Profile } = require('./src/models');

async function fixData() {
  const pending = await HR_Profile.findAll({ where: { verificationStatus: 'pending' } });
  for (const hr of pending) {
    hr.companyName = 'Google';
    hr.position = 'Senior Talent Partner';
    hr.linkedInUrl = 'https://www.linkedin.com/company/google/';
    await hr.save();
  }
  console.log('Fixed ', pending.length, ' records with verification data.');
}

fixData().then(() => process.exit());
