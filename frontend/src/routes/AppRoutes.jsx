import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import SignInPage from '../pages/SignInPage';
import SignUpPage from '../pages/SignUpPage';
import StudentDashboard from '../pages/StudentDashboard';
import FacultyDashboard from '../pages/FacultyDashboard';
import HODDashboard from '../pages/HODDashboard';
import PrincipalDashboard from '../pages/PrincipalDashboard';
import RegistrarDashboard from '../pages/RegistrarDashboard';
import LandingPage from '../pages/LandingPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import AdminSignInPage from '../pages/AdminSignInPage';
import TranscriptVerification from '../pages/TranscriptVerification';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/admin-login" element={<AdminSignInPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      {/* Protected Routes */}
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/hod"
        element={
          <ProtectedRoute allowedRoles={['hod']}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/principal"
        element={
          <ProtectedRoute allowedRoles={['principal']}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/registrar"
        element={
          <ProtectedRoute allowedRoles={['registrar']}>
            <RegistrarDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes; 