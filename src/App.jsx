import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AIQuizGenerator from './pages/teacher/AIQuizGenerator';
import AttendanceManager from './pages/teacher/AttendanceManager';
import StudentDashboard from './pages/student/StudentDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import FuturisticPage from './pages/FuturisticPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/futuristic-campus" element={<FuturisticPage />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
        </Route>

        {/* Protected Teacher Routes (Admin can also access teacher views) */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="/teacher/ai-quiz" element={<AIQuizGenerator />} />
          <Route path="/teacher/attendance" element={<AttendanceManager />} />
          <Route path="/teacher/futuristic-campus" element={<FuturisticPage />} />
          <Route path="/teacher/profile" element={<ProfilePage />} />
        </Route>

        {/* Protected Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/fees" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/futuristic-campus" element={<FuturisticPage />} />
          <Route path="/student/profile" element={<ProfilePage />} />
        </Route>

        {/* Protected Parent Routes */}
        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/parent/fees" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/parent/futuristic-campus" element={<FuturisticPage />} />
          <Route path="/parent/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback Redirect to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;