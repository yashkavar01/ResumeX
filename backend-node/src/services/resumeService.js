const fs = require('fs');
const pdf = require('pdf-parse');
const { Resume, Skill } = require('../models');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Centralized AI configuration
const AI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.0-flash'
];

async function runAiTask(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError = null;

  for (const modelName of AI_MODELS) {
    try {
      console.log(`Attempting AI task with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0,
          topP: 0.1,
          topK: 1
        }
      });
      
      const result = await model.generateContent(prompt);
      const outputText = result.response.text();
      
      // Clean up markdown formatting if present
      const cleanJson = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${modelName} failed/blocked:`, error.message);
      continue; // Try next model
    }
  }

  // If all models fail, throw the last error
  throw lastError;
}

const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

const processAndSaveResume = async (studentId, file) => {
  const text = await extractTextFromPDF(file.path);

  // Call Gemini API to extract skills and ATS score
  const prompt = `
  You are an expert ATS (Applicant Tracking System). Analyze the following resume text.
  Extract all professional technical and soft skills from it.
  Also evaluate the resume out of 100 on how readable, well-structured, and impactful it is (ats_score).
  
  Return ONLY valid JSON in the following format. Ensure there is no markdown formatting around the output, only raw JSON.
  {
    "skills": ["Skill1", "Skill2", "Skill3"],
    "ats_score": 85
  }

  Resume text:
  ${text}
  `;

  let detectedSkills = [];
  let atsScore = 0;

  try {
    const parsed = await runAiTask(prompt);
    detectedSkills = parsed.skills || [];
    atsScore = parsed.ats_score || 0;
  } catch (error) {
    console.error('CRITICAL: All AI models failed for resume processing:', error);
    // Returning empty but allowing the process to continue to avoid 500
  }

  // Save Resume in the DB
  const resume = await Resume.create({
    studentId,
    filename: file.originalname,
    textContent: text,
    atsScore,
  });

  // Ensure skills exist in DB and link them to the resume
  for (const skillName of detectedSkills) {
    if (!skillName) continue;
    const [skillRecord] = await Skill.findOrCreate({ where: { name: skillName } });
    await resume.addSkill(skillRecord);
  }

  return { 
    resumeId: resume.id,
    detectedSkills,
    atsScore
  };
};

module.exports = {
  processAndSaveResume,
  extractTextFromPDF,
  runAiTask
};
