# 🎓 EduPro School Management System

> A modern, secure, full-stack **MERN (MongoDB, Express.js, React, Node.js)** educational platform featuring Role-Based Access Control (RBAC), AI-powered insights, real-time management, and secure email-based authentication.

---

## 🚀 Key Features

* **4-Tier Role-Based Access Control (RBAC):** Dedicated portals and permissions for **Admin, Teacher, Student, and Parent**.
* **Secure Authentication:** JSON Web Token (JWT) authorization, Bcrypt password hashing, and secure Email OTP verification flows.
* **Modern Aesthetic Dashboard UI:** Built with Tailwind CSS, featuring glassmorphism, responsive data tables, modal drawers, and quick-action toolbars.
* **Comprehensive School Modules:**
  * Fee Management & Concessions
  * Attendance & Leave Request Tracking
  * Timetable & Exam Management
  * Resource & Facility Booking
  * Visitor Gate Pass & Behavior Badge System
  * School Notices & Real-time Broadcasts
* **AI-Powered Integration:** Built-in AI assistant features for administrative summaries and automated educational workflows.

---

## 🛠️ Tech Stack

### **Frontend**
* **React.js** (with Vite)
* **Tailwind CSS** (for styling & modern components)
* **Lucide React** (for clean UI icons)
* **Axios** (for API communication)

### **Backend**
* **Node.js & Express.js** (RESTful API architecture)
* **MongoDB Atlas & Mongoose** (Cloud Database & ODM)
* **JWT & Bcryptjs** (Authentication & Security)
* **Nodemailer / Cloudinary** (Email dispatch and file handling)

---

## 📁 Project Architecture

```text
SCHOOL-MANAGEMENT-SYSTEM/
├── backend/
│   ├── config/          # Database & Cloudinary configurations
│   ├── controllers/     # Business logic handlers
│   ├── middleware/      # Auth & RBAC security layers
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # API endpoint route handlers
│   ├── utils/           # Helper services (Email, Crypto)
│   ├── server.js        # Entry point for Express server
│   └── vercel.json      # Serverless deployment configuration
│
└── frontend/
    ├── public/          # Static assets & favicons
    ├── src/
    │   ├── components/  # Reusable UI elements & widgets
    │   ├── context/     # Global state management
    │   ├── pages/       # Portal views (Admin, Teacher, Student, Parent)
    │   ├── App.jsx      # Main router configuration
    │   └── main.jsx     # React DOM entry point
    └── tailwind.config.js
