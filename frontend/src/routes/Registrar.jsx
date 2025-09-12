import React from "react";
import { Routes, Route } from "react-router-dom";
import RegistrarSideBar from "../components/sidebar/RegistrarSideBar";
import RegistrarDashboard from "../pages/RegistrarDashboard";
import RegistrarProfile from "../components/registrar/RegistrarProfile";
import RegistrarSettings from "../components/registrar/RegistrarSettings";
import RegistrarProfileEdit from "../components/registrar/RegistrarProfileEdit";
import RegistrarChangePassword from "../components/registrar/RegistrarChangePassword";
import LeaveApplication from "../components/registrar/LeaveApplication";
import FacultyReport from "../components/registrar/FacultyReport";
import FacultyManagement from "../components/registrar/FacultyManagement";
import StaffManagement from "../components/registrar/StaffManagement";
import EnergyDashboard from "../pages/EnergyDashboard";

const Registrar = () => {
  return (
    <RegistrarSideBar>
      <Routes>
        <Route path="" element={<RegistrarDashboard/>}/>
        <Route path="registrar-profile" element={<RegistrarProfile />} />
        <Route path="registrar-settings" element={<RegistrarSettings />} />
        <Route path="registrar-settings/edit-profile" element={<RegistrarProfileEdit />} /> 
        <Route path="registrar-settings/change-password" element={<RegistrarChangePassword />} />
        <Route path="leave-applications" element={<LeaveApplication />} />
        <Route path="faculty-reports" element={<FacultyReport />} />
        <Route path="faculty-management" element={<FacultyManagement />} />
        <Route path="staff-management" element={<StaffManagement />} />
        <Route path="energy-dashboard" element={<EnergyDashboard />} />
        {/* Placeholder routes for future implementation */}
        <Route path="students" element={<div className="p-8 text-center">Student Management - Coming Soon</div>} />
        <Route path="faculty" element={<div className="p-8 text-center">Faculty Management - Coming Soon</div>} />
        <Route path="departments" element={<div className="p-8 text-center">Department Management - Coming Soon</div>} />
        
      </Routes>
    </RegistrarSideBar>
  );
};

export default Registrar; 