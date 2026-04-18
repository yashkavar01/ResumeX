# ResumeX — AI Resume Analyzer & Career Intelligence Platform

ResumeX is an AI-powered full-stack web application designed to bridge the gap between job seekers and recruiters. It leverages Natural Language Processing (NLP) to automate ATS score calculation, extract technical skills, and provide semantic job-resume matching.

---

## 🚀 Features

## For Students

### AI Resume Analysis
Upload PDF/DOCX resumes to receive a deep audit, including:

- ATS score  
- Strengths  
- Critical red flags  

### Bullet Point Rewriter
Get AI-suggested rewrites for resume bullet points to improve impact and quantifiability.

### Smart Job Matching
Receive curated job recommendations based on your extracted skills with a **Semantic Match Percentage**.

### 1-Click AI Tailor
Automatically adjust your resume profile and highlights to align with specific job descriptions.

---

## For Recruiters (HR)

### Role-Based Dashboards
Dedicated interface for posting jobs and managing requirements.

### Talent Matchmaker
Use the AI Engine to rank all candidates for a specific job based on their skill sets and resume content.

### Application Tracking
Manage the hiring pipeline from:

- Applied  
- Shortlisted  
- Rejected  

---

## For Admins

### HR Verification
Moderate new HR account registrations to ensure platform security.

### Platform Analytics
Monitor global stats, including:

- Total resumes analyzed  
- Active job listings  

---

# 🛠️ Tech Stack

| Layer | Technologies |
|------|-------------|
| Frontend | HTML5, CSS3 (Tailwind), JavaScript (ES6+), Chart.js |
| Backend | Node.js, Express.js |
| Database | MySQL (Sequelize ORM) |
| AI / NLP | Google Gemini AI (`@google/generative-ai`), `pdf-parse` |
| Authentication | JWT-based Role-Based Access Control (RBAC) |

---

# 📂 Project Structure

```plaintext
├── backend-node/         # Node.js Express server
│   ├── src/
│   │   ├── controllers/  # API logic (Auth, Resume, HR, Admin)
│   │   ├── models/       # Sequelize Database models
│   │   ├── services/     # AI Logic & Match Engine
│   │   └── middleware/   # JWT & Role verification
│   ├── uploads/          # Temporary storage for resume files
│   └── index.js          # Entry point

├── data/                 # Sample candidate data
├── index.html            # Main UI
├── app.js                # Frontend logic & API integration
└── style.css             # Custom premium UI styles
