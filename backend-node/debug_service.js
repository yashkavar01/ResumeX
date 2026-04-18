const { processAndSaveResume } = require('./src/services/resumeService');
const fs = require('fs');

async function debug() {
    try {
        fs.writeFileSync('dummy.pdf', 'dummy text here python react mock pdf content');
        const result = await processAndSaveResume(1, { path: 'dummy.pdf', originalname: 'dummy.pdf' });
        console.log('Success:', result);
    } catch(e) {
        console.error('FAILED WITH:', e);
    }
}
debug();
