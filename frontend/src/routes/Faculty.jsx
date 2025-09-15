import React from "react";
import { Routes, Route } from "react-router-dom";
import FacultySideBar from "../components/sidebar/FacultySideBar";
import FacultyDashboard from "../pages/FacultyDashboard";
import TakeAttendance from "../components/faculty/TakeAttendance";
import AddNotes from "../components/faculty/AddNotes";
import Divisions from "../components/faculty/Divisions";
// import StudentStressLevel from "../components/faculty/StudentStressLevel";
import StudentLocation from "../components/faculty/StudentLocation";
import FacultyProfile from "../components/faculty/FacultyProfile";
import FacultySettings from "../components/faculty/FacultySettings";
import FacultyProfileEdit from "../components/faculty/FacultyProfileEdit";
import FacultyChangePassword from "../components/faculty/FacultyChangePassword";
import LeaveApplication from "../components/faculty/LeaveApplication";
import DummyFacultyStress from "../components/faculty/DummyFacultyStress";
import AttendanceReport from "../components/faculty/AttendanceReport";
import StudentsSection from "../components/faculty/StudentsSection";
import StudentsLogs from "../components/faculty/Students_logs";
import Todo from "../components/faculty/Todo.jsx";

const Faculty = () => {
  return (
    <FacultySideBar>
      <Routes>
        <Route path="" element={<FacultyDashboard />} />
        <Route path="take-attendance" element={<TakeAttendance />} />   
        <Route path="add-notes" element={<AddNotes />} />
        <Route path="divisions" element={<Divisions />} />
        <Route path="leave-apply" element={<LeaveApplication />} />
        <Route path="student-stress-level" element={<DummyFacultyStress />} />
        <Route path="location" element={<StudentLocation />} />
        <Route path="faculty-profile" element={<FacultyProfile />} />
        <Route path="faculty-settings" element={<FacultySettings />} />
        <Route path="faculty-settings/edit-profile" element={<FacultyProfileEdit />} />
        <Route path="faculty-settings/change-password" element={<FacultyChangePassword />} />
        <Route path="attendance-report" element={<AttendanceReport />} />
        <Route path="students" element={<StudentsSection />} />
        <Route path="students-logs" element={<StudentsLogs />} />
        <Route path="add-tasks" element={<Todo/>}/>
      </Routes>
    </FacultySideBar>
  );
};

export default Faculty;
