const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'authController.js');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('--- START OF authController.js ---');
  console.log(content);
  console.log('--- END OF authController.js ---');
} else {
  console.log('File not found at:', filePath);
}
