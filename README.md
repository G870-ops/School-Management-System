🎓 EduPro School Management System

A modern, secure, full-stack MERN (MongoDB Atlas, Express.js, React, Node.js) educational platform engineered for cloud serverless deployment (Vercel) with 4-tier Role-Based Access Control (RBAC), Stripe payment settlements, real-time Socket.IO coordination, and AI-assisted workflows.

🚀 Live Production Deployments

Frontend Portal: https://school-management-system-lyart-zeta.vercel.app

Backend REST API: https://school-management-system-backend-bice.vercel.app

API Health Status: https://school-management-system-backend-bice.vercel.app/api/health (status: success, database: connected, readyState: 1)

✨ Key Architectural Features

Universal Cloud CORS & Trust Proxy: Dynamic origin resolution supporting localhost, any https://*.vercel.app preview/production subdomain, and custom domains, alongside Express trust proxy configuration for accurate rate limiting behind cloud load balancers.

Serverless Connection Pooling: Optimized Mongoose connection management with cachedDb reusability across warm serverless function invocations and automatic MONGO_URI sanitization.

Resilient Cloud Email Layer: Gmail SMTP transport configured on Port 587 with explicit STARTTLS and forced IPv4 resolution (family: 4) to eliminate serverless DNS timeout drops, supported by HTTP transactional API fallbacks.

4-Tier Role-Based Access Control (RBAC): Strict authorization middleware protecting administrative, teaching, student, and parent portals.

Secure Multi-School Onboarding: 3-step OTP verification pipeline (send-otp -> verify-otp -> register-school) enabling independent institution provisioning.

Stripe Secure Settlement: Server-side verification for online fee checkout sessions ensuring idempotent invoice reconciliation and instant receipt issuance.

Smart Frontend API Routing: Runtime environment detection in Frontend/frontend/src/config/apiConfig.js that automatically routes requests to production endpoints when hosted on Vercel.

👥 Verified Demo Accounts

The database comes pre-seeded with verified test accounts across all four system roles (Password for all accounts: School@123):

Role

Email Address

Primary Portal Capabilities

Administrator

admin@school.com

School setup, user management, fee structures, reports, teacher permission toggles

Teacher

teacher@school.com

Attendance roll call, homework grading, student exam scores, AI teaching assistant

Student

student@school.com

Timetable viewing, homework submissions, fee invoice payments via Stripe

Parent

parent@school.com

Multi-child switcher, child academic performance tracking, fee settlement

🛠️ Tech Stack

Frontend

React.js & Vite (Single Page Application architecture)

Tailwind CSS (Utility-first responsive styling and UI components)

Lucide React (Modern administrative iconography)

Axios (Robust HTTP client with dynamic interceptors)

Backend

Node.js & Express.js (RESTful API serverless functions)

MongoDB Atlas & Mongoose (Cloud ODM and connection pooling)

JWT & Bcryptjs (Cryptographic authentication & password hashing)

Stripe SDK & Nodemailer (Secure payment gateways & email dispatch)

Google Generative AI (Gemini) (Automated teaching assistance)

📁 Repository Structure

SCHOOL MANAGEMENT SYSTEM/
├── Backend/                                # Express REST API & Serverless Functions
│   ├── api/index.js                        # Vercel serverless entry point
│   ├── config/db.js                        # Cached MongoDB connection pool
│   ├── controllers/                        # Business logic & request handlers
│   ├── middleware/                         # Authentication & RBAC security layers
│   ├── models/                             # Mongoose database schemas
│   ├── routes/                             # API routes mapped under /api
│   ├── tests/                              # Automated Jest test suites (18 suites)
│   ├── utils/                              # Email service, generators, helpers
│   ├── server.js                           # Main Express application configuration
│   └── vercel.json                         # Vercel deployment routing rules
├── Frontend/frontend/                      # React SPA (Vite)
│   ├── src/
│   │   ├── config/apiConfig.js             # Zero-config runtime API base URL detection
│   │   ├── context/AuthContext.jsx         # Global session state & token management
│   │   ├── pages/                          # Role portals (Admin, Teacher, Student, Parent)
│   │   ├── components/                     # Reusable UI widgets, modals, data tables
│   │   └── App.jsx                         # Main router & protected route wrappers
│   └── vite.config.js
└── docs/                                   # Complete architecture, PRD, and design notes


⚙️ Local Installation & Development

Prerequisites

Node.js (v18 or higher recommended)

Git

1. Clone the Repository

git clone https://github.com/G870-ops/School-Management-System.git
cd "SCHOOL MANAGEMENT SYSTEM"


2. Configure Backend

Navigate to the backend directory and install dependencies:

cd Backend
npm install


Create a .env file inside Backend/ with your credentials:

PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_strong_64_character_jwt_secret
OTP_SECRET=your_super_strong_64_character_otp_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
STRIPE_SECRET_KEY=your_stripe_secret_key


Run automated backend tests or start development server:

npm test          # Run all 18 Jest test suites
npm run dev       # Start Express server locally on port 5001


3. Configure Frontend

Open a separate terminal window, navigate to the frontend directory, and install dependencies:

cd Frontend/frontend
npm install


Create a .env file inside Frontend/frontend/:

VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001


Start the frontend Vite development server:

npm run dev       # Starts at http://localhost:5173


📄 Documentation & Rules

Detailed project specifications, architectural decisions, and operational guidelines are available in the docs/ directory:

Architecture & Infrastructure

Product Requirements Document (PRD)

Design System Notes

Project Rules & Compliance

📄 License

This project is open-source and licensed under the MIT License.
