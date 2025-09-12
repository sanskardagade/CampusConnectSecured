import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import LandingPage from "./pages/LandingPage";
import Student from "./routes/Student";
import Faculty from "./routes/Faculty";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HOD from "./routes/HOD";
import Principal from "./routes/Principal";
import Registrar from "./routes/Registrar";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import FacultyDashboard from './pages/FacultyDashboard';
import { AuthProvider } from './context/AuthContext';
import Admin from "./routes/Admin";
import Chatbot from "./components/Chatbot";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminSignInPage from "./pages/AdminSignInPage";
import TranscriptVerification from "./pages/TranscriptVerification";

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage/>} /> 
            <Route path="/signup" element={<SignUpPage/>}/>
            <Route path="/signin" element={<SignInPage/>} />
            <Route path="/about" element={<About />} />
            <Route path="/admin/*" element={<Admin/>}/>
            <Route path="/admin-login" element={<AdminSignInPage/>} />
            <Route path="/verify/:randomcode" element={<TranscriptVerification/>} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/features" element={<Features/>} />
            <Route path="/student/*" element={<Student />} />
            <Route path="/faculty/*" element={<Faculty />} />
            <Route path="/hod/*" element={<HOD/>}/>
            <Route path="/principal/*" element={<Principal />}/>
            <Route path="/registrar/*" element={<Registrar />}/>
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
          </Routes>
          <Chatbot />
        </Router>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;