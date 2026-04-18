const { GoogleGenerativeAI } = require('@google/generative-ai');
async function testCall() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyB5SIk2I5Sj655SWFqFpnfOcoTFnZxPaoU');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('ping');
    console.log('SUCCESS: ', result.response.text());
  } catch (e) {
    console.error('FAILED: ', e);
  }
}
testCall();
