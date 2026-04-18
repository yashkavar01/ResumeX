const FormData = require('form-data');
const fetch = require('node-fetch'); // Needs node-fetch but wait, I can just use native fetch in Node 18+!
const fs = require('fs');

async function testAnalyze() {
    // 1. Register
    let res = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test1@test.com', password: 'abc', role: 'student' })
    });
    console.log('Register:', res.status);

    // 2. Login
    const fd = new FormData();
    fd.append('username', 'test1@test.com');
    fd.append('password', 'abc');
    res = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        body: fd
    });
    const data = await res.json();
    console.log('Login token length:', data.access_token ? data.access_token.length : 'NO TOKEN', data);

    // 3. Upload Document
    // Write dummy pdf
    fs.writeFileSync('dummy.pdf', 'dummy text here python react mock pdf content');
    
    const analyzeFd = new FormData();
    analyzeFd.append('resume', fs.createReadStream('dummy.pdf'));
    
    res = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + data.access_token
        },
        body: analyzeFd
    });
    const analyzeData = await res.json();
    console.log('Analyze Status:', res.status);
    console.log('Analyze Result:', analyzeData);
}

testAnalyze().catch(console.error);
