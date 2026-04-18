const resumeService = require('../services/resumeService');
const { Student, Resume, Skill } = require('../models');

const analyzeResume = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.sub;

    if (!file) {
      return res.status(400).json({ error: 'Missing file' });
    }
    
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
        return res.status(403).json({ error: 'Not a registered student' });
    }

    console.log(`[ANALYZER] Starting deep analysis for Student ${student.id}`);

    // 1. Extract text and check for duplicates (Cache)
    const text = await resumeService.extractTextFromPDF(file.path);
    console.log(`[ANALYZER] Text extracted (${text.length} chars)`);

    // Check if this student already uploaded the same text before
    const existingResume = await Resume.findOne({
      where: { 
        studentId: student.id,
        textContent: text
      },
      order: [['createdAt', 'DESC']]
    });

    if (existingResume && existingResume.analysisData) {
      console.log(`[ANALYZER] FOUND EXISTING MATCH (ID: ${existingResume.id}). Reusing previous analysis for 100% consistency.`);
      return res.json({
        message: 'Resume analyzed successfully (cached result)',
        data: {
          id: existingResume.id,
          ...existingResume.analysisData
        }
      });
    }

    // 2. Setup AI Prompt - Highly Detailed
    const prompt = `
    You are an elite Executive Career Coach and a top-tier Technical Recruiter.
    Analyze the following resume text with extreme precision and provide a deep, high-value audit.
    
    Your output MUST be a strict JSON object with this exact schema:
    {
      "score": 85,
      "skills": ["Python", "React", "AWS", "etc"],
      "strengths": [
         "Comprehensive bullet points with quantifiable results (e.g., 20% growth).",
         "Strong alignment with modern cloud native architecture principles.",
         "Detailed documentation of leadership in cross-functional teams."
      ],
      "red_flags": [
         "Significant gaps in employment history without explanation.",
         "Vague descriptions of 'responsibilities' rather than 'achievements'.",
         "Lack of specific technical stack mentioned in earlier roles."
      ],
      "fluff_vs_impact_analysis": "The resume starts strong with metric-driven accomplishments but dilutes its impact in the latter half with generic corporate jargon. To improve, convert passive tasks into active wins.",
      "bullet_point_rewrites": [
         {
           "original_text": "Helped team build feature",
           "ai_suggested_rewrite": "Spearheaded the development of a real-time analytics engine, resulting in a 30% reduction in query latency and improved stakeholder decision-making speed."
         }
      ]
    }

    Ensure the response is high-quality, professional, and provides actual value. NO markdown.
    
    Resume text:
    ${text}
    `;

    // 3. Generate Analysis
    let analysis = {};
    try {
      analysis = await resumeService.runAiTask(prompt);
      console.log("[ANALYZER] AI Data Received");
    } catch (err) {
      console.error("[ANALYZER] AI Error:", err.message);
      return res.status(500).json({ error: 'AI processing failed. ' + err.message });
    }

    // 4. Save to Database
    let savedResume;
    try {
      savedResume = await Resume.create({
        studentId: student.id,
        filename: file.originalname,
        textContent: text,
        atsScore: analysis.score || 0,
        analysisData: analysis
      });
    } catch (dbError) {
      console.error("[ANALYZER] DB Error:", dbError.message);
      return res.status(500).json({ error: 'DB persistence failed.' });
    }

    // 5. Link Skills
    const detectedSkills = analysis.skills || [];
    for (const skillName of detectedSkills) {
      if (!skillName) continue;
      const [skillRecord] = await Skill.findOrCreate({ where: { name: skillName } });
      await savedResume.addSkill(skillRecord);
    }
    
    // Return a FLATTENED object so the frontend app.js can read it directly.
    res.json({
      message: 'Resume analyzed successfully',
      data: {
        id: savedResume.id,
        ...analysis // Spread the AI analysis directly into the data object
      }
    });

  } catch (error) {
    console.error('[ANALYZER] Unexpected Error:', error);
    res.status(500).json({ error: 'Failed to analyze resume: ' + error.message });
  }
};

const optimizeResume = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { company } = req.body;
    
    if (!company) {
       return res.status(400).json({ error: 'Missing company parameter' });
    }

    const student = await Student.findOne({ where: { userId } });
    if (!student) return res.status(403).json({ error: 'Not a registered student' });

    const latestResume = await Resume.findOne({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']]
    });

    if (!latestResume || !latestResume.textContent) {
       return res.status(404).json({ error: 'No resume found' });
    }

    const prompt = `
    Act as a hiring manager for ${company}.
    Review this resume and return strict JSON:
    {
       "current_match": 80,
       "improved_match": 95,
       "suggestions": [
          {"priority": "High", "text": "Add GCP experience"},
          {"priority": "Med", "text": "Quantify your achievements"}
       ]
    }
    Resume text:
    ${latestResume.textContent}
    `;

    try {
      const parsed = await resumeService.runAiTask(prompt);
      res.status(200).json({
         message: 'Success',
         data: parsed
      });
    } catch (err) {
      res.status(500).json({ error: 'Optimization failed.' });
    }

  } catch (err) {
    res.status(500).json({ error: 'System error' });
  }
};

const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const student = await Student.findOne({ where: { userId } });
    if (!student) return res.status(403).json({ error: 'Not a registered student' });

    const resume = await Resume.findOne({ where: { id, studentId: student.id } });
    if (!resume) return res.status(404).json({ error: 'Resume not found or not yours' });

    await resume.destroy();
    console.log(`[ANALYZER] Deleted resume ID: ${id}`);
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('[ANALYZER] Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};

module.exports = {
  analyzeResume,
  optimizeResume,
  deleteResume
};
