# School Management System — Complete Code Structure & Workflow

## Project Layout

```
SCHOOL MANAGEMENT SYSTEM/
├── Backend/          ← Node.js / Express REST API
└── Frontend/
    └── frontend/     ← React (Vite) SPA
```

---

# BACKEND — Complete Structure & Workflow

## Folder Map

```
Backend/
├── server.js                  ← Entry point: Express app bootstrap
├── .env / .env.example        ← All environment variables
├── vercel.json                ← Serverless deployment config
│
├── config/                    ← DB connection setup
├── models/                    ← Mongoose schemas (MongoDB documents)
├── controllers/               ← Business logic (pure functions, no Express req/res leakage)
├── routes/                    ← Express Router definitions
├── middleware/                ← Reusable request pipeline functions
├── utils/                     ← Helper services (email, cloudinary, parent access)
├── api/                       ← Vercel serverless entry (wraps server.js)
├── uploads/                   ← Temporary local file storage (Multer)
└── tests/                     ← Node built-in test runner specs
```

---

## server.js — The Entry Point

**What it does (step by step):**

1. **DNS override** — sets Google (8.8.8.8) and Cloudflare (1.1.1.1) DNS so MongoDB Atlas SRV records resolve correctly on cloud platforms with broken ISP DNS.
2. **Middleware stack** (applied in order):
   - `helmet` → sets secure HTTP headers (XSS, clickjacking protection)
   - `compression` → gzip all API responses
   - `cors` → whitelist origins from `CLIENT_URL` env var; also allows `localhost`, `*.vercel.app`
   - `express.json()` → parse JSON request bodies
   - `express-rate-limit` → global 100 req/15min per IP limiter
3. **Static file serving** → `/uploads` folder exposed for locally stored files
4. **Route mounting** → all route files mounted under `/api/*`
5. **MongoDB connection** → `mongoose.connect()` using `MONGO_URI`
6. **Socket.io** → real-time chat room (attached to the same HTTP server)
7. **Default user seeding** → on first boot, creates demo accounts (admin/teacher/parent/student) from `.env` credentials
8. **Global error handler** → catches all `next(error)` calls; returns structured JSON errors

---

## Models — MongoDB Schemas

### `User.js` ⭐ Most Important Model
**Fields:**
| Field | Purpose |
|---|---|
| `name`, `email`, `password` | Core credentials |
| `role` | `admin` / `teacher` / `student` / `parent` |
| `classId`, `rollNumber`, `subject` | Role-specific academic data |
| `phone`, `profilePhoto`, `profilePhotoPublicId` | Contact & avatar |
| `parentEmail`, `linkedStudentId` | Parent-student relationship |
| `isVerified` + `isEmailVerified` | Both kept in sync (dual flags for compatibility) |
| `otpHash`, `otpExpiresAt`, `otpPurpose`, `otpAttempts`, `otpLastSentAt` | OTP security fields |
| `canCreateStudents` | Teacher-specific permission |
| `tokenVersion` | JWT session invalidation counter |

**Methods on the model:**
- `createOTP(purpose, expiryMinutes)` → generates crypto-random 6-digit OTP, hashes it with SHA-256 HMAC, stores the hash (never raw OTP), returns the raw OTP to be emailed
- `verifyOTPCode(candidateOtp, purpose)` → timing-safe comparison, checks expiry, attempts limit, purpose match
- `clearOTP()` → wipes all OTP fields after use
- `matchPassword(entered)` → bcrypt compare
- **Pre-save hook** → auto-hashes password on create/update; syncs `isVerified` ↔ `isEmailVerified`

### `OTP.js` — Legacy OTP Collection
A separate collection for the **school registration** and **student registration** flows (older flow that uses a JWT `registrationToken` after verification). Has a MongoDB TTL index on `expiresAt` — documents auto-delete when expired.

### Other Models
| Model | Purpose |
|---|---|
| `Attendance.js` | Daily class attendance records |
| `Exam.js` + `ExamResult.js` | Exams and per-student results |
| `Fee.js` + `FeeStructure.js` | Fee payments and fee category templates |
| `Homework.js` + `HomeworkSubmission.js` | Homework assignments and student submissions |
| `LeaveRequest.js` | Staff/student leave applications |
| `Notice.js` | School-wide announcements |
| `ResourceBooking.js` | Room/lab/equipment booking |
| `SchoolSetting.js` | School name, logo, contact details |
| `StudentBehaviorBadge.js` | Positive/negative behavior badges |
| `StudyMaterial.js` | Uploaded PDF/video resources |
| `Timetable.js` | Weekly class schedule |
| `VisitorPass.js` | Visitor gate pass (QR code based) |

---

## Middleware

### `authMiddleware.js`
Two exported functions chained on protected routes:

**`protect`** (Authentication)
```
Request → Check "Authorization: Bearer <token>" header
       → jwt.verify(token, JWT_SECRET) → decode { id, tokenVersion }
       → User.findById(id).select('-password -otpHash')
       → Check tokenVersion matches DB value (catches server-side logout)
       → Check isVerified — unverified users get 403
       → Attach req.user → call next()
```

**`authorize(...roles)`** (Authorization / RBAC)
```
Request (after protect) → check req.user.role is in allowed roles array
                       → if not → 403 with message showing required vs. actual role
                       → if yes → call next()
```

**Usage pattern:**
```
router.get('/users', protect, authorize('admin', 'teacher'), getAllUsers)
                     ↑ authn   ↑ authz (RBAC)
```

### `uploadMiddleware.js`
Multer configuration for:
- `profileImageUpload` → accepts JPG/PNG/WebP ≤5MB, saves to `uploads/` temporarily
- After upload, file is forwarded to Cloudinary and the local temp file is deleted

### `classAccessMiddleware.js`
Ensures teachers can only access data for classes they are assigned to (prevents cross-class data leaks).

---

## Controllers

### `authController.js` — The Core Auth Engine

**10 exported controller functions:**

#### 1. `registerUser` → `POST /api/auth/register`
```
Client sends: { name, email, password, role }
  ↓
Validate inputs (password ≥8 chars, valid email)
  ↓
Check if email already exists:
  → Already verified: return 409 Conflict
  → Exists but unverified: resend OTP (with cooldown check)
  → New email: create User (isVerified: false)
  ↓
user.createOTP('email_verification', 10 min) → raw OTP
  ↓
sendVerificationEmail(email, rawOtp) via Nodemailer
  ↓
Return 201 with userId (+ raw OTP in dev mode for testing)
```

#### 2. `verifyEmail` → `POST /api/auth/verify-email`
```
Client sends: { email, otp }
  ↓
Find user by email
  ↓
user.verifyOTPCode(otp, 'email_verification')
  → Check: hash match (timing-safe), not expired, attempts < 5, correct purpose
  ↓
On success: isVerified = true, clearOTP(), save
  ↓
Return JWT token → account now active and logged in
```

#### 3. `forgotPassword` → `POST /api/auth/forgot-password`
```
Client sends: { email }
  ↓
If user not found → return safe 200 (anti-enumeration protection)
  ↓
Cooldown check (60s between requests)
  ↓
createOTP('password_reset', 10 min) → sendPasswordResetEmail
  ↓
Return 200 (same message whether user exists or not)
```

#### 4. `resetPassword` → `POST /api/auth/reset-password`
```
Client sends: { email, otp, newPassword }
  ↓
user.verifyOTPCode(otp, 'password_reset')
  ↓
On success: update password (auto-hashed by pre-save hook)
            tokenVersion++ (invalidates all old JWTs)
            clearOTP()
  ↓
Return 200 — user must log in again with new password
```

#### 5. `resendOTP` → `POST /api/auth/resend-otp`
Handles resending OTP for both `email_verification` and `password_reset` purposes, with 60-second cooldown enforcement.

#### 6. `loginUser` → `POST /api/auth/login`
```
Client sends: { email, password, role }
  ↓
Find user, bcrypt.compare(password, hash)
  ↓
Role match check (optional — prevents logging in as wrong role)
  ↓
isVerified check → 403 with requiresVerification flag if not verified
  ↓
Return JWT + full user profile object
```

#### 7. `logoutUser` → `POST /api/auth/logout` *(protected)*
```
req.user already resolved by protect middleware
  ↓
User.findByIdAndUpdate(_id, { $inc: { tokenVersion: 1 } })
  ↓
All existing JWTs with old tokenVersion are now instantly invalid
  ↓
Return 200 — client clears localStorage
```

#### 8. `sendOTP` / `verifyOTP` — Legacy School & Student Registration Flow
Uses the separate `OTP` collection. After OTP verification, issues a short-lived `registrationToken` (JWT) that is passed back to complete registration (`registerUser` with `registrationToken` for admin, `registerStudent` for students).

#### 9. User Management (Admin only)
- `createUserWithCredentials` → Admin creates teacher/student/parent, sends credentials email
- `createStudentAccount` → Teacher creates student (requires `canCreateStudents` permission)
- `getAllUsers` → List users with role/class filters
- `updateUser` → Edit user fields
- `deleteUser` → Remove user

#### 10. Profile & Security
- `getCurrentUser` → `GET /api/auth/me` — validates current session
- `uploadProfilePhoto` → Cloudinary upload, update user record
- `changePassword` → Verify current password, update, bump tokenVersion
- `getSecurityStats` → Admin dashboard: user counts, verification rate, security health score
- `getMyChildren` → Parent gets linked student(s) info

---

## Routes Summary

### `authRoutes.js`
```
Rate Limiters:
  otpRequestLimiter   → 10 requests / 15 min / IP
  otpVerifyLimiter    → 20 attempts / 15 min / IP
  passwordResetLimiter→  5 requests / 15 min / IP

Public Routes (no auth):
  POST /register        → registerUser       [otpRequestLimiter]
  POST /verify-email    → verifyEmail        [otpVerifyLimiter]
  POST /forgot-password → forgotPassword     [passwordResetLimiter]
  POST /reset-password  → resetPassword      [otpVerifyLimiter]
  POST /resend-otp      → resendOTP          [otpRequestLimiter]
  POST /login           → loginUser
  POST /send-otp        → sendOTP (legacy)   [otpRequestLimiter]
  POST /verify-otp      → verifyOTP (legacy) [otpVerifyLimiter]
  POST /register-student→ registerStudent

Protected Routes (JWT required):
  POST /logout          → logoutUser         [protect]
  GET  /me              → getCurrentUser     [protect]
  POST /profile-photo   → uploadProfilePhoto [protect + multer]
  POST /change-password → changePassword     [protect]
  GET  /my-children     → getMyChildren      [protect + authorize('parent')]
  GET  /security-stats  → getSecurityStats   [protect + authorize('admin','teacher')]

Admin/Staff Routes:
  POST /create-user     → createUserWithCredentials [protect + authorize('admin')]
  POST /create-student  → createStudentAccount      [protect + authorize('admin','teacher')]
  GET  /users           → getAllUsers               [protect + authorize('admin','teacher')]
  PUT  /users/:id       → updateUser               [protect + authorize('admin')]
  DELETE /users/:id     → deleteUser               [protect + authorize('admin')]
```

### Other Route Files (all under `/api/`)
| Route File | Prefix | Access |
|---|---|---|
| `attendanceRoutes.js` | `/api/attendance` | protect + role checks |
| `examRoutes.js` | `/api/exams` | protect + role checks |
| `feeRoutes.js` | `/api/fees` | protect + role checks |
| `homeworkRoutes.js` | `/api/homework` | protect + role checks |
| `leaveRoutes.js` | `/api/leaves` | protect + role checks |
| `noticeRoutes.js` | `/api/notices` | protect |
| `resourceRoutes.js` | `/api/resources` | protect + role checks |
| `timetableRoutes.js` | `/api/timetable` | protect |
| `behaviorRoutes.js` | `/api/behavior` | protect + authorize('admin','teacher') |
| `studyMaterialRoutes.js` | `/api/study-materials` | protect |
| `reportRoutes.js` | `/api/reports` | protect + authorize('admin','teacher') |
| `visitorRoutes.js` | `/api/visitors` | protect |
| `schoolSettingRoutes.js` | `/api/settings` | protect + authorize('admin') |
| `aiRoutes.js` | `/api/ai` | protect |

---

## Utils

### `emailService.js`
Three-tier email delivery strategy (tried in order):
1. **HTTP API** (Resend / SendGrid / Brevo) — immune to SMTP port blocks on cloud platforms
2. **Nodemailer SMTP** — Gmail or custom SMTP host from `.env`
3. **Dev fallback** — logs email to console (when `NODE_ENV !== 'production'`)

Exported functions:
- `sendVerificationEmail(email, otp, name, schoolName)` — styled HTML with OTP box
- `sendPasswordResetEmail(email, otp, name, schoolName)` — red-themed reset email
- `sendOTPEmail(email, otp, schoolName)` — legacy alias
- `sendCredentialsEmail({to, name, role, email, password})` — new account welcome email
- `sendFeeReminderEmail({...})` — fee due date reminder

### `cloudinaryService.js`
Wraps Cloudinary SDK: `uploadToCloudinary(filePath, folder)` → returns `{ url, publicId }`. Used for profile photos.

### `parentAccess.js`
`getParentStudentIds(parentUser)` — resolves which student IDs a parent can see (via `linkedStudentId` or `parentEmail` match).

---

# FRONTEND — Complete Structure & Workflow

## Folder Map

```
Frontend/frontend/src/
├── main.jsx               ← React DOM root, wraps <App> with <AuthProvider>
├── App.jsx                ← React Router: all route definitions
├── index.css              ← Global base styles
├── App.css                ← App-level styles
│
├── api/
│   └── axiosInstance.js   ← Configured Axios with auth headers + interceptors
│
├── config/
│   └── apiConfig.js       ← getApiBaseUrl() — dev vs prod API URL switching
│
├── context/
│   └── AuthContext.jsx    ← Global auth state (user, token, login, logout, loading)
│
├── hooks/
│   └── useAuth.js         ← Convenience hook wrapping AuthContext
│
├── components/            ← Reusable UI components
│   ├── ProtectedRoute.jsx ← Route guard (auth + RBAC)
│   ├── Sidebar.jsx        ← Navigation sidebar (role-aware)
│   ├── AIAssistantHub.jsx ← Gemini AI chat interface
│   ├── BehaviorBadges.jsx ← Student badge system
│   ├── ChatRoom.jsx       ← Real-time socket.io chat
│   ├── CommandPalette.jsx ← Keyboard shortcut launcher (Ctrl+K)
│   ├── FuturisticSmartCampus.jsx ← 3D campus visualization
│   ├── ResourceBooking.jsx       ← Room/lab booking UI
│   ├── UpiPaymentModal.jsx       ← UPI QR payment modal
│   └── VisitorGatePass.jsx       ← Visitor pass with QR code
│
├── pages/
│   ├── Login.jsx          ← All auth flows in one page
│   ├── ProfilePage.jsx    ← User profile, password change, security stats
│   ├── FuturisticPage.jsx ← Wrapper for smart campus view
│   ├── admin/
│   │   └── AdminDashboard.jsx    ← Full admin control panel
│   ├── teacher/
│   │   ├── TeacherDashboard.jsx
│   │   ├── AIQuizGenerator.jsx
│   │   └── AttendanceManager.jsx
│   ├── student/
│   │   └── StudentDashboard.jsx
│   └── parent/
│       └── ParentDashboard.jsx
│
└── utils/
    └── profilePhoto.js    ← getProfilePhotoUrl(url) helper
```

---

## Frontend Data Flow

### Step 1 — App Bootstrap (`main.jsx`)
```
ReactDOM.createRoot(...)
  └── <AuthProvider>          ← wraps everything; manages global auth state
        └── <App />           ← defines all routes
```

### Step 2 — Token Validation on Page Load (`AuthContext.jsx`)
```
AuthProvider mounts
  ↓
useEffect → GET /api/auth/me (with stored token in Authorization header)
  → Success: setUser(data.data), setToken(storedToken) → loading = false
  → Failure (401/expired): clear localStorage, setUser(null) → loading = false
  ↓
{!loading && children} → nothing renders until validation is complete
                          (prevents flash of protected content)
```

### Step 3 — Routing (`App.jsx`)
```
<Routes>
  /login                    → <Login /> (always public)

  /admin/dashboard          → <ProtectedRoute allowedRoles={['admin']}>
  /teacher/dashboard        → <ProtectedRoute allowedRoles={['teacher','admin']}>
  /student/dashboard        → <ProtectedRoute allowedRoles={['student']}>
  /parent/dashboard         → <ProtectedRoute allowedRoles={['parent']}>

  /* (catch-all)            → <Navigate to="/login" />
</Routes>
```

### Step 4 — ProtectedRoute Logic
```
const { user, loading } = useAuth()

if (loading)              → return null (wait for token validation)
if (!user)                → <Navigate to="/login" />
if (!allowedRoles.includes(user.role)) → 403 page with user's actual role shown
else                      → <Outlet /> (renders the matched child route)
```

---

## `Login.jsx` — All Auth Flows in One Page

The Login page uses a `mode` state variable to switch between multiple flows without page navigation:

### Mode: `'login'`
```
User enters email + password + role
  ↓
POST /api/auth/login
  ↓
Success → login(userData, token) → navigate to role-based dashboard
  → admin   → /admin/dashboard
  → teacher → /teacher/dashboard
  → student → /student/dashboard
  → parent  → /parent/dashboard

Error (requiresVerification: true) → switch mode to 'verify_email'
Error (invalid credentials)        → show error message
```

### Mode: `'verify_email'`
```
User enters 6-digit OTP sent to their email
  ↓
POST /api/auth/verify-email { email, otp }
  ↓
Success → login(userData, token) → navigate to dashboard
Expired → show "request new code" button
Wrong   → show "X attempts remaining"
```

### Mode: `'forgot_password'`
**Step 'request':**
```
User enters email
  ↓
POST /api/auth/forgot-password
  ↓
Show "Check your email" + switch to 'verify_reset' step
```
**Step 'verify_reset':**
```
User enters OTP + new password
  ↓
POST /api/auth/reset-password { email, otp, newPassword }
  ↓
Success → switch back to login mode
```

### Mode: `'register_student'`
```
Student fills name/email/password/class/parentEmail
  ↓
POST /api/auth/register (standard flow)
  ↓
Returns → switch to 'verify_email' mode to complete OTP step
```

### Mode: `'register_school'`
**Step 'input':**
```
Admin fills schoolName, adminName, email, password
  ↓
POST /api/auth/send-otp { email, purpose: 'school_registration' }
  ↓
Show OTP input → switch to 'otp' step
```
**Step 'otp':**
```
Admin enters OTP
  ↓
POST /api/auth/verify-otp → returns registrationToken (JWT)
  ↓
POST /api/auth/register { ...adminData, registrationToken }
  ↓
login(user, token) → navigate to /admin/dashboard
```

---

## `axiosInstance.js` — The HTTP Client

**Request Interceptor:**
```
Every outgoing request:
  → reads localStorage.getItem('token')
  → adds header: Authorization: Bearer <token>
```

**Response Interceptor:**
```
401 response → clear localStorage, redirect to /login
              (catches expired or server-invalidated JWTs)
429 response → override message: "Too many requests..."
5xx response → surface backend message or generic server error
Network error → "Network error. Cannot reach server."
```

---

## `AuthContext.jsx` — Global Auth State

**State exposed to all components:**
| Value | Type | Description |
|---|---|---|
| `user` | object / null | Current authenticated user (name, email, role, classId, etc.) |
| `token` | string / null | The raw JWT string |
| `loading` | boolean | True while `/me` validation is running on mount |
| `login(userData, jwtToken)` | function | Called after successful login/verify-email |
| `logout()` | async function | Calls `POST /api/auth/logout` → bumps tokenVersion → clears localStorage |
| `updateUser(updates)` | function | Merges partial updates (e.g. new profilePhoto URL) |

---

## Dashboards — Role-Based Views

### AdminDashboard
- User management table (create/edit/delete teachers, students, parents)
- Attendance overview, exam results, fee collection stats
- Security health score panel
- School settings editor
- Visitor gate pass management
- AI Assistant Hub

### TeacherDashboard
- Mark attendance for assigned classes
- Create homework, upload study materials
- AI Quiz Generator (Gemini API)
- View student behavior badges
- Resource booking
- Chat room

### StudentDashboard
- View attendance history
- View homework + submit assignments
- View exam results, fee status
- Download study materials
- Timetable viewer
- UPI payment for fees
- AI Assistant

### ParentDashboard
- View child's attendance, marks, fee status, behavior badges
- View notices
- Chat with school

---

## Sidebar.jsx — Navigation

- Reads `user.role` from `AuthContext`
- Renders role-appropriate nav links
- Collapsible (state saved to `localStorage`)
- Profile photo from `user.profilePhoto` (Cloudinary URL or placeholder)
- Logout button → `await logout()` → navigate to `/login`

---

## Complete Auth Security Flow (End-to-End)

```
1. REGISTRATION
   Browser → POST /api/auth/register
   Backend → Create User (isVerified: false)
           → user.createOTP('email_verification')  [SHA-256 HMAC hash stored]
           → sendVerificationEmail via Nodemailer
   Browser ← { userId, email, otp (dev only) }

2. EMAIL VERIFICATION (2FA-style OTP)
   Browser → POST /api/auth/verify-email { email, otp }
   Backend → user.verifyOTPCode() [timing-safe comparison]
           → isVerified = true, clearOTP()
           → generateToken() [JWT signed with JWT_SECRET, 30 days]
   Browser ← { token, user } → stored in localStorage

3. LOGIN
   Browser → POST /api/auth/login { email, password, role }
   Backend → bcrypt.compare(password, hash)
           → role check, isVerified check
           → generateToken(user) [includes tokenVersion]
   Browser ← { token, user } → AuthContext.login() called

4. PROTECTED API CALL
   Browser → GET /api/auth/me
             Header: Authorization: Bearer <jwt>
   Backend → jwt.verify(token) → { id, tokenVersion }
           → User.findById(id) → compare tokenVersion
           → isVerified check
   Browser ← { user data }

5. LOGOUT (Server-side invalidation)
   Browser → POST /api/auth/logout
             Header: Authorization: Bearer <jwt>
   Backend → User.findByIdAndUpdate({ $inc: { tokenVersion: 1 } })
           ← 200 OK
   Browser → localStorage.removeItem('token', 'user')
           → AuthContext clears user state
           → Navigate to /login

   [Any subsequent request with OLD token → 401 "session no longer valid"]

6. ROLE-BASED ACCESS CONTROL
   Every protected route: protect → authorize('admin') or authorize('admin','teacher') etc.
   Frontend: ProtectedRoute checks user.role against allowedRoles before rendering
```

---

## Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Server port (5001) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signs all JWTs |
| `OTP_SECRET` | HMAC key for OTP hashing (falls back to JWT_SECRET) |
| `CLIENT_URL` | Comma-separated allowed CORS origins |
| `ADMIN_EMAIL/PASSWORD` etc. | Demo account seeding |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE` | Nodemailer SMTP credentials |
| `RESEND_API_KEY` / `SENDGRID_API_KEY` / `BREVO_API_KEY` | HTTP email API alternatives |
| `CLOUDINARY_*` | Profile photo storage |
| `GEMINI_API_KEY` | Google AI for quiz/assistant features |
| `STRIPE_SECRET_KEY` | Online fee payment processing |
| `NODE_ENV` | `production` / `development` (controls OTP exposure in responses) |
