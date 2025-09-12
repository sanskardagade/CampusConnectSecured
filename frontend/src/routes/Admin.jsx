import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminSideBar from "../components/sidebar/AdminSideBar";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProfile from "../components/admin/AdminProfile";
import AdminStressDisplay from "../components/admin/StressDisplay";
import FacultyReport from "../components/admin/FacultyReport";
import AdminProfileEdit from "../components/admin/AdminProfileEdit";
import AdminChangePassword from "../components/admin/AdminChangePassword";

const Admin = () => {
  return (
    <AdminSideBar>
      <Routes>
        <Route path="" element={<AdminDashboard />} />
        <Route path="admin-profile" element={<AdminProfile />} />
        <Route path="view-stress-level" element={<AdminStressDisplay />} />
        <Route path="faculty-report" element={<FacultyReport />} />
        <Route path="admin-settings/edit-profile" element={<AdminProfileEdit />} />
        <Route path="admin-settings/change-password" element={<AdminChangePassword />} />

      </Routes>
    </AdminSideBar>
  );
};

export default Admin;
