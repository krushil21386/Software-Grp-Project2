import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import MedicineAI from './pages/MedicineAI';
import DoctorLocator from './pages/DoctorLocator';
import Hospitals from './pages/Hospitals';
import DoctorProfile from './pages/DoctorProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import BookAppointmentPage from './pages/BookAppointmentPage';
import DoctorAvailability from './pages/DoctorAvailability';
import EmergencyServices from './pages/EmergencyServices';
import MedicineDelivery from './pages/MedicineDelivery';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter 
        basename="/Software-Grp-Project"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/medicine-ai"
              element={
                <ProtectedRoute>
                  <MedicineAI />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-locator"
              element={
                <ProtectedRoute>
                  <DoctorLocator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospitals"
              element={
                <ProtectedRoute>
                  <Hospitals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/:id"
              element={
                <ProtectedRoute>
                  <DoctorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-records"
              element={
                <ProtectedRoute>
                  <MedicalRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-appointment"
              element={
                <ProtectedRoute>
                  <BookAppointmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-availability"
              element={
                <ProtectedRoute>
                  <DoctorAvailability />
                </ProtectedRoute>
              }
            />
            {/* Emergency Services - Public, no login required */}
            <Route
              path="/emergency-services"
              element={<EmergencyServices />}
            />
            <Route
              path="/medicine-delivery"
              element={
                <ProtectedRoute>
                  <MedicineDelivery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
