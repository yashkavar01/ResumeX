const { Student, Job, Skill, Resume, Job_Matches } = require('../models');
const { runAiTask } = require('./resumeService');

const getRecommendations = async (studentId) => {
  // 1. Fetch student and their skills through resumes
  const student = await Student.findByPk(studentId, {
    include: [{
      model: Resume,
      include: [{
        model: Skill
      }]
    }]
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Aggregate all unique skills from all of the student's resumes
  const studentSkillIds = new Set();
  let aggregateResumeText = '';
  
  student.Resumes.forEach(resume => {
    aggregateResumeText += resume.textContent + '\n\n';
    resume.Skills.forEach(skill => {
      studentSkillIds.add(skill.id);
    });
  });

  // 2. Fetch all jobs with their required skills
  const jobs = await Job.findAll({
    include: [{ model: Skill }]
  });

  const preFilteredJobs = [];

  // 3. Calculate mathematical intersection for pre-filtering
  for (const job of jobs) {
    const jobSkillIds = job.Skills.map(s => s.id);
    
    if (jobSkillIds.length === 0) {
      continue;
    }

    let intersectionCount = 0;
    for (const skillId of jobSkillIds) {
      if (studentSkillIds.has(skillId)) {
        intersectionCount++;
      }
    }

    if (intersectionCount > 0) {
      preFilteredJobs.push(job);
    }
  }

  if (preFilteredJobs.length === 0) {
     return [];
  }

  // 4. Send to Gemini for Semantic Evaluation
  const jobsDetails = preFilteredJobs.map(job => ({
     id: job.id,
     title: job.title,
     description: job.description
  }));

  const prompt = `
  You are an expert AI Job Matcher. Evaluate the semantic alignment between the student's resume and a list of pre-filtered jobs.
  
  Student Resume:
  ${aggregateResumeText}
  
  Pre-filtered Jobs:
  ${JSON.stringify(jobsDetails)}
  
  For each job, calculate a "semanticMatchPercentage" (0-100) and provide a brief "reason".
  Return ONLY a valid JSON array of objects with keys: "jobId" (number), "semanticMatchPercentage" (number), and "reason" (string). Absolutely no markdown formatting.
  `;

  let aiResults = [];
  try {
     aiResults = await runAiTask(prompt);
  } catch (err) {
     console.error("Error from AI matching:", err.message);
     // Fallback if AI parsing fails
     return [];
  }

  const matches = [];

  // 5. Build final response and save to DB
  for (const job of preFilteredJobs) {
     const aiEval = aiResults.find(r => r.jobId === job.id);
     const matchPercentage = aiEval ? aiEval.semanticMatchPercentage : 0;

     const [matchRecord, created] = await Job_Matches.findOrCreate({
      where: { studentId: studentId, jobId: job.id },
      defaults: { matchPercentage }
     });

     if (!created) {
       matchRecord.matchPercentage = matchPercentage;
       await matchRecord.save();
     }

     matches.push({
       jobId: job.id,
       title: job.title,
       company: job.hrId,
       matchPercentage: matchPercentage,
       reason: aiEval ? aiEval.reason : "AI Evaluation failed."
     });
  }

  matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return matches;
};

module.exports = {
  getRecommendations
};
