# AI-powered-interview-preparation-platform

YT-Gemini is a full-stack AI-powered interview preparation platform that analyzes a candidate's **resume, self-description, and job description** to generate a personalized interview preparation report.

The platform uses **Google Gemini** to analyze the candidate's profile against a target role and provides technical questions, behavioral questions, skill gaps, and a structured 7-day preparation plan.

It also allows users to generate an **ATS-friendly, job-tailored resume PDF** using AI.

---

## 🚀 Features

### 🔐 Authentication

* User registration and login
* Password hashing with bcrypt
* JWT-based authentication
* JWT stored in HTTP cookies
* Protected API routes
* Logout with token blacklisting
* Fetch currently authenticated user

### 📄 Resume Analysis

Users can upload their resume as a PDF.

The backend:

1. Receives the uploaded resume
2. Extracts text from the PDF
3. Combines the resume information with the user's self-description
4. Compares the profile against the provided job description
5. Sends the information to Google Gemini
6. Generates a structured interview preparation report

### 🤖 AI Interview Report

The generated report includes:

* **Job Match Score** — 0–100
* **Technical Interview Questions**
* **Behavioral Interview Questions**
* **Skill Gaps**
* **Skill Gap Severity**

  * Low
  * Medium
  * High
* **7-Day Interview Preparation Plan**
* **Role/Job Title**

Each interview question includes:

* Question
* Interviewer's intention
* Guidance on how to answer

### 📑 AI Resume Generator

The platform can generate a tailored resume based on:

* Existing resume content
* Self-description
* Target job description

The AI generates structured HTML which is converted into a downloadable PDF using Puppeteer.

The generated resume is designed to be:

* Job-specific
* ATS-friendly
* Simple and professional
* 1–2 pages when possible

### 📚 Interview Report History

Authenticated users can:

* View previous interview reports
* Open individual reports
* Generate new reports
* Download AI-generated resumes

### 🛡️ AI Response Validation & Fallbacks

The backend uses **Zod schemas** to define the expected AI response structure.

The AI service also includes normalization and fallback handling to ensure required sections are available even when the model response is incomplete.

---

## 🏗️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* React Router
* Axios
* SCSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Multer
* PDF parsing

### AI

* Google Gemini API
* `@google/genai`
* Zod
* Zod-to-JSON-Schema

### PDF

* PDF parsing with `pdf-parse`
* PDF generation with Puppeteer

---

## 📂 Project Structure

```text
Yt-gemini/
│
├── Backend/
│   ├── server.js
│   ├── package.json
│   │
│   └── src/
│       ├── app.js
│       │
│       ├── config/
│       │   └── database.js
│       │
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   └── interview.controller.js
│       │
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   └── file.middleware.js
│       │
│       ├── models/
│       │   ├── blacklist.model.js
│       │   ├── interviewReport.model.js
│       │   └── user.model.js
│       │
│       ├── routes/
│       │   ├── auth.routes.js
│       │   └── interview.routes.js
│       │
│       ├── services/
│       │   └── ai.service.js
│       │
│       └── tests/
│           └── interviewReportNormalization.test.js
│
└── Frontend/
    ├── package.json
    ├── vite.config.js
    │
    └── src/
        ├── App.jsx
        ├── app.routes.jsx
        ├── main.jsx
        │
        ├── features/
        │   ├── auth/
        │   │   ├── auth.context.jsx
        │   │   ├── components/
        │   │   ├── hooks/
        │   │   ├── pages/
        │   │   └── services/
        │   │
        │   └── interview/
        │       ├── hooks/
        │       ├── pages/
        │       ├── services/
        │       └── style/
        │
        └── styles/
```

---

# 🔄 Application Flow

```text
                     ┌──────────────────────┐
                     │       Frontend       │
                     │   React + Vite       │
                     └──────────┬───────────┘
                                │
                                │ HTTP / Axios
                                ▼
                     ┌──────────────────────┐
                     │       Express        │
                     │       Backend        │
                     └──────────┬───────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
              ┌─────────┐  ┌─────────┐  ┌──────────┐
              │  JWT    │  │ MongoDB │  │  Gemini  │
              │  Auth   │  │         │  │   API    │
              └─────────┘  └─────────┘  └────┬─────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Interview Report│
                                    │                 │
                                    │ • Match Score   │
                                    │ • Questions     │
                                    │ • Skill Gaps    │
                                    │ • 7-Day Plan    │
                                    └─────────────────┘
```

---

# 🧠 AI Interview Report Flow

The user provides:

```text
Resume PDF
     +
Self Description
     +
Job Description
```

The backend extracts the resume text and sends the combined information to Gemini.

Gemini generates:

```text
                    AI Interview Report
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Match Score      Interview       Skill Gaps
                       Questions
          │                │                │
          │         ┌──────┴──────┐         │
          │         │             │         │
          ▼         ▼             ▼         ▼
        0-100   Technical     Behavioral   Severity
                 Questions     Questions
                           │
                           ▼
                    7-Day Preparation
                         Plan
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `Backend` directory.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key
```

The `.env` file should **never be committed to GitHub**.

Add it to `.gitignore`:

```gitignore
.env
node_modules/
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone https://github.com/your-username/Yt-gemini.git

cd Yt-gemini
```

---

## 2. Install Backend Dependencies

```bash
cd Backend
npm install
```

---

## 3. Configure Environment Variables

Create:

```text
Backend/.env
```

Add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key
```

---

## 4. Start the Backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

---

## 5. Install Frontend Dependencies

Open another terminal:

```bash
cd Frontend
npm install
```

---

## 6. Start the Frontend

```bash
npm run dev
```

The Vite development server will run on the local development URL shown in the terminal, typically:

```text
http://localhost:5173
```

---

# 🔌 API Endpoints

## Authentication

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User

```http
GET /api/auth/get-me
```

Requires authentication.

### Logout

```http
GET /api/auth/logout
```

---

# 🎯 Interview APIs

### Generate Interview Report

```http
POST /api/interview/
```

Requires authentication.

Multipart form data:

```text
resume          → PDF file
selfDescription → Candidate description
jobDescription  → Target job description
```

---

### Get All Interview Reports

```http
GET /api/interview/
```

Returns the authenticated user's previous reports.

---

### Get Interview Report

```http
GET /api/interview/report/:interviewId
```

---

### Generate Resume PDF

```http
POST /api/interview/resume/pdf/:interviewReportId
```

Returns a generated PDF resume.

---

# 🧪 Testing

The backend includes a Node.js test for interview report normalization.

Run:

```bash
node --test tests/interviewReportNormalization.test.js
```

The test verifies behavior such as:

* Generating a fallback title from the job description
* Preserving an explicitly provided AI-generated title

---

# 🔐 Security

The application implements several security-related mechanisms:

* Password hashing using bcrypt
* JWT authentication
* HTTP cookie-based token storage
* Protected routes
* Token blacklist during logout
* User-specific interview report access
* Environment variables for secrets
* Resume upload size limitation

Resume uploads are limited to:

```text
3 MB
```

---

# 🧩 Key Backend Components

### `auth.middleware.js`

Responsible for:

* Reading the JWT from cookies
* Checking the blacklist
* Verifying the JWT
* Attaching the authenticated user to the request

### `file.middleware.js`

Handles resume uploads using Multer and keeps uploaded files in memory for processing.

### `ai.service.js`

The core AI service responsible for:

* Calling Gemini
* Enforcing structured JSON responses
* Validating AI output
* Normalizing incomplete responses
* Providing fallback content
* Generating HTML resumes
* Converting HTML resumes into PDFs

### `interviewReport.model.js`

Stores:

* Resume text
* Self-description
* Job description
* Match score
* Technical questions
* Behavioral questions
* Skill gaps
* Preparation plan
* User reference
* Report title

---

# 💡 Why I Built This

Preparing for a technical interview often requires understanding what a particular company or role is looking for and then connecting those requirements to your own experience.

YT-Gemini was built to make this process more personalized.

Instead of providing generic interview questions, the application uses the candidate's **actual resume and target job description** to create a preparation plan specific to that role.

---

# 📈 Future Improvements

Some possible improvements include:

* [ ] Live AI mock interviews
* [ ] Voice-based interview practice
* [ ] Interview answer evaluation
* [ ] Interview performance tracking
* [ ] More detailed resume analysis
* [ ] Job description keyword analysis
* [ ] Multiple AI model providers
* [ ] Streaming AI responses
* [ ] Production deployment
* [ ] Rate limiting
* [ ] Email-based authentication
* [ ] Password reset functionality
* [ ] Improved mobile UI
* [ ] Dashboard analytics

---

# 📌 Project Highlights

This project demonstrates practical experience with:

* Full-stack JavaScript development
* REST API development
* React application architecture
* Authentication and authorization
* JWT and cookies
* MongoDB data modeling
* File uploads
* PDF processing
* AI API integration
* Structured AI responses
* Schema validation
* AI-generated content
* PDF generation
* Error handling
* API service architecture
* Protected resources

---

## 👨‍💻 Author

**Adithya Gowda**

Full Stack Developer
MERN Stack | AI Integration

---

## ⭐ If you found this project useful

Consider giving the repository a ⭐ on GitHub.

