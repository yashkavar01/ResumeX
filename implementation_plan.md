# Make ResumeX a Fully Working App with MySQL

We will transform your static ResumeX frontend into a fully functional application using your existing FastAPI backend and a new MySQL database.

## User Review Required

> [!IMPORTANT]
> **MySQL Configuration**: We will configure the backend to use a MySQL database. Do you already have MySQL installed and running on your Windows machine? If so, we will need your MySQL username, password, and the name of an empty database you want to use (e.g., `resumex_db`). We can set this up using a `.env` file so you don't have to share credentials directly here, or if you prefer I can provide instructions on how to set it up.

## Proposed Changes

---

### Backend (FastAPI & Database)

We will significantly expand the `backend/` directory to handle real data and authentication.

#### [NEW] `backend/requirements.txt`
*   Add dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `pymysql`, `passlib`, `python-jose`, `python-multipart`, `pdfplumber`, `python-dotenv`.

#### [NEW] `backend/database.py`
*   Set up SQLAlchemy engine and session management connected to the MySQL database.

#### [NEW] `backend/models.py`
*   Define MySQL schema:
    *   `User`: id, name, email, password_hash, role
    *   `Resume`: id, user_id, filename, text_content, ats_score, etc.
    *   `Skill`: id, resume_id, skill_name

#### [NEW] `backend/auth.py`
*   Implement JWT-based authentication, password hashing (bcrypt), and dependency injection for getting the current logged-in user.

#### [MODIFY] `backend/main.py`
*   Include routers/endpoints:
    *   `POST /register`: Create a new user.
    *   `POST /login`: Authenticate and return a JWT token.
    *   `POST /analyze`: Require authentication, parse the PDF, extract skills, and save results to the MySQL database.
    *   `GET /dashboard`: Fetch user statistics and previous resume parsing results.
    *   `POST /optimize`: A mock or simplified AI optimizer endpoint for company jobs.

---

### Frontend (HTML & JavaScript)

We will modify your frontend code to communicate with the real API endpoints rather than using hardcoded simulation functions.

#### [MODIFY] `index.html`
*   Ensure login and registration forms have distinct inputs and IDs (add name to registration if needed).
*   Add placeholders/IDs to dynamically inject user data into the dashboard sections.

#### [MODIFY] `app.js`
*   **Authentication**: Replace `handleLogin()` with actual `fetch('/login')` requests. Handle storing the JWT token in `localStorage`.
*   **API Client**: Create a wrapper around `fetch` to automatically attach the JWT `Authorization: Bearer <token>` header to all requests.
*   **Dashboard Loading**: Replace static stats with a `fetch('/dashboard')` call when logging in, updating the UI with real resume scores and skills.
*   **Resume Analysis**: Update the existing `analyzeResume()` function to include the Auth header so it maps to the correct user in the database.

## Open Questions

> [!WARNING]
> 1.  **AI Implementation**: For the "Company-Specific Optimizer" feature, do you want to use a real AI model (like Google Gemini API or OpenAI) to generate suggestions, or should I implement a simulated logic engine for now based on predefined company keywords? If real AI, we'll need an API key.
> 2.  **Job Matches**: Should the job matches be pulled from a real external API, or just simulated data randomized based on the extracted skills in the MySQL database?

## Verification Plan

### Automated Tests
*   Ensure backend starts successfully with `uvicorn main:app`.
*   Establish and verify connection to MySQL database using the credentials provided.
*   Run FastAPI Swagger UI (`/docs`) to test endpoints directly.

### Manual Verification
*   We will start the backend server and open the `index.html` file in a browser.
*   Register a new user account, login, and verify the dashboard loads.
*   Upload a sample PDF resume, watch the progress bar, and confirm the skills are extracted and saved to MySQL.
*   Log out and log back in to ensure persistence.
