const { HR_Profile } = require('./src/models');

async function checkData() {
  const pending = await HR_Profile.findAll({ where: { verificationStatus: 'pending' } });
  console.log('Pending HRs in DB:', JSON.stringify(pending, null, 2));
}

checkData().then(() => process.exit());
