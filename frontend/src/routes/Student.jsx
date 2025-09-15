import React from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import StudentDashboard from "../pages/StudentDashboard";
import AttendanceView from "../components/student/AttendanceView";
import DownloadNotes from '../components/student/DownloadNotes';

import StudentSideBar from '../components/sidebar/StudentSideBar';
import "../App.css"
import StudentProfile from '../components/student/StudentProfile';
import StudentProfileEdit from '../components/student/StudentProfileEdit';
import StudentPasswordChange from '../components/student/StudentPasswordChange';
import StudentSubjects from '../components/student/StudentSubjects';
import LandingPage from '../pages/LandingPage';
import StudentAttendance from '../components/student/StudentAttendance';
import Transcript from '../components/student/Transcript';
import StudentDashboard from '../pages/StudentDashboard';

const Student = () => {
  return (
   <>
 
    <StudentSideBar>
        <Routes>
            <Route path="" element={<StudentDashboard />} />
            <Route path="/attendance" element={<AttendanceView />} />
            <Route path="/notes" element={<DownloadNotes />} />
            <Route path="/student-profile" element={<StudentProfile />} />
            <Route path="/transcript" element={<Transcript />} />
            <Route path="/student-settings/edit-profile" element={<StudentProfileEdit />} />
            <Route path="/student-settings/change-password" element={<StudentPasswordChange />} />
            <Route path="/subjects" element={<StudentSubjects />} />
            <Route path="/attendance" element={<StudentAttendance />} />
        </Routes>
    </StudentSideBar>

   
   </>
  )
}

export default Student
