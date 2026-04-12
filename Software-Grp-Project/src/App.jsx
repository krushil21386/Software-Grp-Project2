import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar/Navbar';
import ToastContainer from './components/Toast/ToastContainer';
import { NotificationProvider } from './contexts/NotificationContext';
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
import HealthPassport from './pages/HealthPassport';
import MedicineDelivery from './pages/MedicineDelivery';
import AdminDashboard from './pages/AdminDashboard';
import PrescriptionCenter from './pages/PrescriptionCenter';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter 
          basename="/Software-Grp-Project"
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="app">
            <ToastContainer />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              
              <Route path="/medicine-ai" element={<ProtectedRoute><MedicineAI /></ProtectedRoute>} />
              <Route path="/doctor-locator" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}><DoctorLocator /></ProtectedRoute>} />
              <Route path="/hospitals" element={<ProtectedRoute><Hospitals /></ProtectedRoute>} />
              <Route path="/doctor/:id" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}><DoctorProfile /></ProtectedRoute>} />
              <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
              <Route path="/medical-records" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><MedicalRecords /></ProtectedRoute>} />
              <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}><BookAppointmentPage /></ProtectedRoute>} />
              <Route path="/doctor-availability" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAvailability /></ProtectedRoute>} />
              <Route path="/health-passport" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}><HealthPassport /></ProtectedRoute>} />
              <Route path="/medicine-delivery" element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}><MedicineDelivery /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={['patient']}><PrescriptionCenter /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
