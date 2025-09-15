import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, useNavigate } from "react-router-dom";
import { 
  FiUsers, 
  FiUserCheck,
  FiActivity,
  FiAward,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiTarget,
  FiChevronRight,
  FiHome,
  FiBook,
  FiAlertTriangle,
  FiClock,
  FiPieChart,
  FiMapPin,
  FiX
} from 'react-icons/fi';
import { Check, X } from 'lucide-react';
import axios from 'axios';
import FacultyLogDisplay from '../components/faculty/FacultyLogDisplay';
import FacultyAttendanceOverview from '../components/hod/FacultyAttendanceOverview';

import HeaderHOD from '../components/common/HeaderHOD';
import HeaderMobile from '../components/common/HeaderMobile';
import { useIsMobile } from '../components/hooks/use-mobile';
import { AiFillBell, AiOutlineFilePdf, AiOutlineSetting, AiOutlineLogout } from 'react-icons/ai';

const MobileBottomTabsHOD = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const tabs = [
    { path: '/hod', label: 'Dashboard', icon: <FiHome /> },
    { path: '/hod/leave-approval', label: 'Leaves', icon: <AiFillBell /> },
    { path: '/hod/report', label: 'Report', icon: <AiOutlineFilePdf /> },
    { path: '/hod/view-stress-level', label: 'Stress', icon: <FiActivity /> },
    { path: '/hod/hod-settings', label: 'Settings', icon: <AiOutlineSetting /> },
    { path: '/', label: 'Logout', icon: <AiOutlineLogout />, isLogout: true },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-red-900 text-white flex justify-between items-center px-1 py-1 shadow-t border-t border-red-800">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => {
            if (tab.isLogout) {
              onLogout();
            } else {
              navigate(tab.path);
            }
          }}
          className={`flex flex-col items-center flex-1 px-1 py-1 focus:outline-none ${location === tab.path ? 'text-yellow-300' : ''}`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-[10px] leading-none">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

const HODDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCard, setExpandedCard] = useState(null);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyLogs, setFacultyLogs] = useState([]);
  const [facultyStressData, setFacultyStressData] = useState([]);
  const [facultyStressLoading, setFacultyStressLoading] = useState(true);
  const [facultyStressError, setFacultyStressError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [assignedTasksHistory, setAssignedTasksHistory] = useState([]);
  const [loadingTaskHistory, setLoadingTaskHistory] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [showPendingTasksModal, setShowPendingTasksModal] = useState(false);
  
  // State for all data with proper initialization
  const [dashboardData, setDashboardData] = useState({
    studentAttendance: [],
    facultyAttendance: [],
    researchProjects: [],
    staffCount: 0,
    attendanceLogsCount: 0,
    stressLevels: {
      students: {
        high: 0,
        medium: 0,
        low: 0,
        trends: {
          weekly: '0%',
          monthly: '0%'
        }
      },
      faculty: {
        high: 0,
        medium: 0,
        low: 0,
        trends: {
          weekly: '0%',
          monthly: '0%'
        }
      }
    },
    departmentStats: {
      totalStudents: 0,
      totalFaculty: 0,
      ongoingProjects: 0,
      avgAttendance: 0
    },
    studentPerformance: [],
    facultyWorkload: []
  });

  const [nonTeachingStaff, setNonTeachingStaff] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null); // { type, id, name }
  const [profileLogs, setProfileLogs] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayCounts, setTodayCounts] = useState({ students: 0, faculty: 0, staff: 0 });

  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Add a ref for the non-teaching staff section
  const nonTeachingStaffRef = useRef(null);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setShowLogoutModal(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Fetch dashboard data and faculty members
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching dashboard and faculty data...');

        // Fetch faculty members first
        const facultyResponse = await fetch('http://82.112.238.4:9000/api/hod/faculty', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (facultyResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        if (!facultyResponse.ok) {
          throw new Error('Error fetching faculty data');
        }

        const facultyData = await facultyResponse.json();
        console.log('Faculty data received:', facultyData);
        setFacultyMembers(facultyData || []); // Ensure facultyData is an array

        // Fetch faculty logs for last active location
        const logsResponse = await fetch('http://82.112.238.4:9000/api/hod/faculty-log', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        let logsData = [];
        if (logsResponse.ok) {
          const logsJson = await logsResponse.json();
          // logsJson can be { logs, faculty } or just logs array
          logsData = Array.isArray(logsJson.logs) ? logsJson.logs : logsJson;
        }
        setFacultyLogs(logsData);

        // Fetch dashboard data
        const dashboardResponse = await fetch('http://82.112.238.4:9000/api/hod/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!dashboardResponse.ok) {
          throw new Error('Error fetching dashboard data');
        }

        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard data received:', dashboardData);

        // Fetch non-teaching staff list for department
        let staffList = [];
        try {
          const staffRes = await fetch('http://82.112.238.4:9000/api/hod/nonteaching', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          if (staffRes.ok) {
            staffList = await staffRes.json();
          }
        } catch (e) { staffList = []; }
        setNonTeachingStaff(staffList);

        // Fetch attendance logs count for department
        let attendanceLogsCount = 0;
        try {
          const logsRes = await fetch('http://82.112.238.4:9000/api/hod/faculty-log', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          if (logsRes.ok) {
            const logsJson = await logsRes.json();
            attendanceLogsCount = Array.isArray(logsJson.logs) ? logsJson.logs.length : 0;
          }
        } catch (e) {
          attendanceLogsCount = 0;
        }

        // Update state with safeguards for all arrays
        setDashboardData(prevData => ({
          ...dashboardData,
          staffCount: staffList.length,
          attendanceLogsCount,
          departmentStats: {
            ...(dashboardData.departmentStats || {}),
            totalFaculty: facultyData.length // Ensure faculty count is preserved
          },
          studentAttendance: dashboardData.studentAttendance || [],
          facultyAttendance: dashboardData.facultyAttendance || [],
          researchProjects: dashboardData.researchProjects || [],
          studentPerformance: dashboardData.studentPerformance || [],
          facultyWorkload: dashboardData.facultyWorkload || [],
          stressLevels: {
            students: {
              ...(dashboardData.stressLevels?.students || prevData.stressLevels.students),
              high: dashboardData.stressLevels?.students?.high || 0,
              medium: dashboardData.stressLevels?.students?.medium || 0,
              low: dashboardData.stressLevels?.students?.low || 0,
              trends: {
                weekly: dashboardData.stressLevels?.students?.trends?.weekly || '0%',
                monthly: dashboardData.stressLevels?.students?.trends?.monthly || '0%'
              }
            },
            faculty: {
              ...(dashboardData.stressLevels?.faculty || prevData.stressLevels.faculty),
              high: dashboardData.stressLevels?.faculty?.high || 0,
              medium: dashboardData.stressLevels?.faculty?.medium || 0,
              low: dashboardData.stressLevels?.faculty?.low || 0,
              trends: {
                weekly: dashboardData.stressLevels?.faculty?.trends?.weekly || '0%',
                monthly: dashboardData.stressLevels?.faculty?.trends?.monthly || '0%'
              }
            }
          }
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.message === 'No authentication token found') {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch faculty stress data
  useEffect(() => {
    const fetchFacultyStress = async () => {
      setFacultyStressLoading(true);
      try {
        const response = await fetch('http://82.112.238.4:9000/api/faculty/student-stress-level', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch faculty stress data');
        const data = await response.json();
        // Filter for faculty only (assuming faculty have a property or by exclusion)
        // If all are faculty, just use as is
        const transformed = data.map(item => ({
          id: item.id,
          name: item.name,
          erpid: item.erpid,
          score: Math.round(parseFloat(item.confidence_score) * 100),
          status: item.stress_status,
          timestamp: item.timestamp
        }));
        // Group by ERP ID, keep latest entry
        const facultyMap = new Map();
        transformed.forEach(entry => {
          if (!facultyMap.has(entry.erpid) || new Date(entry.timestamp) > new Date(facultyMap.get(entry.erpid).timestamp)) {
            facultyMap.set(entry.erpid, entry);
          }
        });
        setFacultyStressData(Array.from(facultyMap.values()));
        setFacultyStressError(null);
      } catch (err) {
        setFacultyStressError(err.message);
        setFacultyStressData([]);
      } finally {
        setFacultyStressLoading(false);
      }
    };
    fetchFacultyStress();
  }, []);

  // Fetch assigned tasks history for HOD (only when modal is opened)
  const fetchAssignedTasksHistory = useCallback(async () => {
    setLoadingTaskHistory(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://82.112.238.4:9000/api/hod/assigned-tasks/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignedTasksHistory(res.data.tasks || []);
    } catch (err) {
      setAssignedTasksHistory([]);
    } finally {
      setLoadingTaskHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedTasksHistory();
  }, [fetchAssignedTasksHistory]);

  // Calculate percentages
  const calculatePercentage = (present, total) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  // Red color theme variants
  const theme = {
    primary: 'bg-gradient-to-r from-red-600 to-red-800',
    secondary: 'bg-gradient-to-r from-red-700 to-red-900',
    light: 'bg-red-50',
    accent: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.3)"
    }
  };

  const cardExpandVariants = {
    collapsed: { height: "auto" },
    expanded: { height: "auto" }
  };

  const handleFacultyCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFacultyModal(true);
  };

  const handlePersonClick = (type, id, name) => {
    setSelectedPerson({ type, id, name });
    setShowProfileModal(true);
    setProfileLoading(true);
    setProfileLogs([]);
    const url = type === 'faculty'
      ? `http://82.112.238.4:9000/api/hod/faculty-profile/${id}`
      : `http://82.112.238.4:9000/api/hod/staff-profile/${id}`;
    fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        // Use all logs returned from the backend for this person
        setProfileLogs(Array.isArray(data.logs) ? data.logs : []);
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  };

  //fetch today counts for faculty, students, and non-teaching staff
  useEffect(() => {
    const fetchTodayCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const [facultyRes, studentRes, staffRes] = await Promise.all([
          axios.get('http://82.112.238.4:9000/api/hod/faculty-today-attendance-count', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(e => ({ data: { count: 0 } })), // Fallback if error
          axios.get('http://82.112.238.4:9000/api/hod/student-today-attendance-count', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(e => ({ data: { count: 0 } })),
          axios.get('http://82.112.238.4:9000/api/hod/nonteaching-today-attendance-count', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(e => ({ data: { count: 0 } }))
        ]);
        
        setTodayCounts({
          faculty: facultyRes.data?.count || 0,
          students: studentRes.data?.count || 0,
          staff: staffRes.data?.count || 0
        });
      } catch (e) {
        console.error('Error fetching today counts:', e);
        setTodayCounts({ students: 0, faculty: 0, staff: 0 });
      }
    };
    
    fetchTodayCounts();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTodayCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate assigned and pending task counts and arrays
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison

  const isSameDay = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const assignedTasks = assignedTasksHistory.filter(task => {
    if (!task.createdAt) return false;
    const created = new Date(task.createdAt);
    return isSameDay(created, today);
  });

  const pendingTasks = assignedTasks.filter(task => {
    const hasIncomplete = (task.facultyAssignments || []).some(fa => fa.status !== 'completed');
    return hasIncomplete;
  });

  if (loading) {
    return (
      <>
        {isMobile ? <HeaderHOD /> : <HeaderMobile title="Dashboard" />}
        <div className={`pt-16 flex items-center justify-center min-h-[60vh]`}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-screen"
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "linear"
              }}
              className="h-16 w-16 rounded-full border-4 border-t-red-600 border-r-red-600 border-b-transparent border-l-transparent"
            ></motion.div>
          </motion.div>
        </div>
        {isMobile && <MobileBottomTabsHOD onLogout={handleLogout} />}
      </>
    );
  }

  return (
    <>
      {isMobile ? <HeaderHOD /> : <HeaderMobile title="Dashboard" />}
      <div className={`flex-1 overflow-auto bg-gray-50 p-3 sm:p-4 md:p-6 ${isMobile ? 'pt-16 pb-14' : ''}`}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={`bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border ${theme.border}`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0">
            <div>
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-2xl font-bold text-gray-900"
              >
                HOD <span className={theme.text}>Dashboard</span>
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 space-y-1"
              >
                <p className="font-medium text-sm sm:text-base">{dashboardData.name || 'HOD Name'}</p>
                <p className="text-xs sm:text-sm">ERP ID: {dashboardData.hodErpId || 'Not Available'}</p>
                <p className="text-xs sm:text-sm">{dashboardData.department || 'Department'} - {dashboardData.branch || 'Branch'}</p>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 lg:mt-0 w-full lg:w-auto"
            >
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                {['overview', 'faculty', 'totalActivities', 'ongoingActivities', 'students', 'tasks', 'pendingTasks'].map((tab) => (
                  <motion.button
                    key={tab}
                    className={`px-2 sm:px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-xs sm:text-sm ${
                      activeTab === tab ? theme.primary + ' text-white' : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                    onClick={() => {
                      if (tab === 'tasks') {
                        setShowTasksModal(true);
                      } else if (tab === 'pendingTasks') {
                        setShowPendingTasksModal(true);
                      } else {
                        setActiveTab(tab);
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {tab === 'totalActivities' ? 'Total Department Activities' : 
                     tab === 'ongoingActivities' ? 'Ongoing Department Activities' : 
                     tab === 'tasks' ? (
                       <>
                         Assigned Tasks
                         <span className="ml-1 inline-block bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                           {assignedTasks.length}
                         </span>
                       </>
                     ) : tab === 'pendingTasks' ? (
                       <>
                         Pending Tasks
                         <span className="ml-1 inline-block bg-yellow-600 text-white text-xs rounded-full px-2 py-0.5">
                           {pendingTasks.length}
                         </span>
                       </>
                     ) : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.div 
          className="space-y-4 sm:space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Overview Section */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {[
                  { 
                    title: 'Total Students', 
                    value: dashboardData.departmentStats?.totalStudents || 0, 
                    icon: <FiUsers className="text-white sm:w-6 sm:h-6" size={20} />, 
                    trend: 'up',
                  },
                  { 
                    title: 'Faculty Members', 
                    value: dashboardData.departmentStats?.totalFaculty || 0, 
                    icon: <FiUserCheck className="text-white sm:w-6 sm:h-6" size={20} />, 
                    trend: 'neutral',
                    onClick: () => setActiveTab('faculty')
                  },
                  { 
                    title: 'Non-Teaching Staff',
                    value: dashboardData.staffCount || 0,
                    icon: <FiUsers className="text-white sm:w-6 sm:h-6" size={20} />,
                    trend: 'neutral',
                    onClick: () => {
                      setActiveTab('faculty');
                      setTimeout(() => {
                        if (nonTeachingStaffRef.current) {
                          nonTeachingStaffRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  },
                  {
                    title: 'Total Department Activities',
                    value: dashboardData.departmentStats?.ongoingProjects || 0,
                    icon: <FiActivity className="text-white sm:w-6 sm:h-6" size={20} />,
                    trend: 'neutral',
                    onClick: () => {
                      alert('Coming Soon!');
                    }
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    variants={itemVariants}
                    whileHover="hover"
                    className={`${theme.primary} text-white rounded-xl p-3 sm:p-5 shadow-lg ${stat.onClick ? 'cursor-pointer' : ''}`}
                    onClick={stat.onClick}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center mb-3 sm:mb-4">
                        {stat.icon}
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold mb-1">{stat.value}</h3>
                    <p className="text-xs sm:text-sm opacity-90">{stat.title}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* New row of white stat boxes */}
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-4 sm:mt-6">
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow flex flex-col items-start border border-gray-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center mb-2 sm:mb-3">
                    <FiUsers className="text-red-600 sm:w-[22px] sm:h-[22px]" size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{todayCounts.students}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Students Present Today</p>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow flex flex-col items-start border border-gray-100 cursor-pointer hover:bg-red-50 transition" onClick={() => navigate('/hod/report')}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center mb-2 sm:mb-3">
                    <FiUserCheck className="text-red-600 sm:w-[22px] sm:h-[22px]" size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{todayCounts.faculty}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Faculty Present Today</p>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow flex flex-col items-start border border-gray-100 cursor-pointer hover:bg-red-50 transition" onClick={() => navigate('/hod/report')}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center mb-2 sm:mb-3">
                    <FiUsers className="text-red-600 sm:w-[22px] sm:h-[22px]" size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{todayCounts.staff}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Non-Teaching Staff Present Today</p>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow flex flex-col items-start border border-gray-100 cursor-pointer hover:bg-red-50 transition" onClick={() => alert('Coming Soon!')}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center mb-2 sm:mb-3">
                    <FiActivity className="text-red-600 sm:w-[22px] sm:h-[22px]" size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{dashboardData.departmentStats?.pendingProjects || 0}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Ongoing Department Activities</p>
                </div>
              </motion.div>

              {/* Custom Quick Sections: Recent Leave Approvals & Top 5 Faculty Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                {/* Recent Leave Approvals */}
                <RecentLeaveApprovals />
                {/* Faculty Stress Notifications */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-red-200 h-full"
                >
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center text-red-800">
                    <FiAlertTriangle className="mr-2 text-red-800" /> Faculty Stress Notifications
                  </h3>
                  {facultyStressLoading ? (
                    <div className="text-gray-500 text-sm">Loading...</div>
                  ) : facultyStressError ? (
                    <div className="text-red-500 text-sm">{facultyStressError}</div>
                  ) : (
                    (() => {
                      // Filter for faculty stressed for more than 7 days
                      const now = new Date();
                      const stressedFaculty = (facultyStressData || []).filter(faculty => {
                        if (!faculty.timestamp) return false;
                        const days = (now - new Date(faculty.timestamp)) / (1000 * 60 * 60 * 24);
                        return (faculty.status === 'Stressed' || faculty.status === 'At Risk') && days >= 7;
                      });
                      if (stressedFaculty.length === 0) {
                        return <div className="text-gray-500 text-sm">No faculty have been stressed for more than 7 days.</div>;
                      }
                      return (
                        <div className="overflow-x-auto">
                          {/* Mobile Card View */}
                          <div className="block sm:hidden space-y-3">
                            {stressedFaculty.map(faculty => {
                              const days = Math.floor((now - new Date(faculty.timestamp)) / (1000 * 60 * 60 * 24));
                              return (
                                <div key={faculty.erpid} className="bg-red-50 rounded-lg p-3 border border-red-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-red-800 text-sm cursor-pointer" onClick={() => handlePersonClick('faculty', faculty.id, faculty.name)}>{faculty.name}</span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-900 font-semibold">{faculty.status}</span>
                                  </div>
                                  <div className="text-xs text-red-700 space-y-1">
                                    <div>ERP ID: {faculty.erpid}</div>
                                    <div>Days Stressed: <span className="font-bold">{days} days</span></div>
                                    <div className="text-gray-500">Last Updated: {faculty.timestamp ? new Date(faculty.timestamp).toLocaleString() : 'N/A'}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Desktop Table View */}
                          <div className="hidden sm:block">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left text-sm text-red-700 border-b border-red-200">
                                  <th className="pb-3">Name</th>
                                  <th className="pb-3">ERP ID</th>
                                  <th className="pb-3">Stress Level</th>
                                  <th className="pb-3">Days Stressed</th>
                                  <th className="pb-3">Last Updated</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stressedFaculty.map(faculty => {
                                  const days = Math.floor((now - new Date(faculty.timestamp)) / (1000 * 60 * 60 * 24));
                                  return (
                                    <tr key={faculty.erpid} className="border-b border-red-100 bg-red-50">
                                      <td className="py-3 font-medium cursor-pointer text-red-800" onClick={() => handlePersonClick('faculty', faculty.id, faculty.name)}>{faculty.name}</td>
                                      <td className="py-3 text-red-700">{faculty.erpid}</td>
                                      <td className="py-3">
                                        <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-900 font-semibold">{faculty.status}</span>
                                      </td>
                                      <td className="py-3 text-red-700 font-bold">{days} days</td>
                                      <td className="py-3 text-xs text-gray-500">{faculty.timestamp ? new Date(faculty.timestamp).toLocaleString() : 'N/A'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </motion.div>
                {/* Top 5 Recent Faculty Logs */}
                {/* <RecentFacultyLogs facultyMembers={facultyMembers} handlePersonClick={handlePersonClick} /> */}
              </div>
              {/* Faculty Attendance Overview Section */}
              {/* <FacultyAttendanceOverview /> */}
            </>
          )} 

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Student Attendance */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-4 sm:mb-6"
              >
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center">
                    <FiUsers className={`mr-2 ${theme.text}`} />
                    Student Attendance
                  </h2>
                  <button className={`text-xs sm:text-sm ${theme.text} font-medium flex items-center`}>
                    View All <FiChevronRight className="ml-1" />
                  </button>
                </div>

                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                  {(dashboardData.studentAttendance || []).map((course, index) => {
                    const total = (course.present || 0) + (course.absent || 0);
                    const percentage = calculatePercentage(course.present || 0, total);
                    
                    return (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-red-50"
                        whileHover={{ x: 5 }}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{course.course || 'Unknown Course'}</span>
                            <span className="text-xs text-gray-500">{course.date || 'Unknown Date'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span>Present:</span>
                              <span className="text-green-600 font-medium">{course.present || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Absent:</span>
                              <span className="text-red-600 font-medium">{course.absent || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Late:</span>
                              <span className="text-yellow-600 font-medium">{course.late || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Professor:</span>
                              <span className="text-gray-700">{course.professor || 'Unknown'}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Room: {course.room || 'Unknown'}</span>
                            <div className="flex items-center">
                              <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    percentage >= 90 ? 'bg-green-500' :
                                    percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">{percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-3">Course</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Present</th>
                        <th className="pb-3">Absent</th>
                        <th className="pb-3">Late</th>
                        <th className="pb-3">Professor</th>
                        <th className="pb-3">Room</th>
                        <th className="pb-3">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboardData.studentAttendance || []).map((course, index) => {
                        const total = (course.present || 0) + (course.absent || 0);
                        const percentage = calculatePercentage(course.present || 0, total);
                        
                        return (
                          <motion.tr
                            key={index}
                            variants={itemVariants}
                            className="border-b border-gray-100 hover:bg-red-50"
                            whileHover={{ x: 5 }}
                          >
                            <td className="py-4 font-medium">{course.course || 'Unknown Course'}</td>
                            <td className="py-4 text-sm">{course.date || 'Unknown Date'}</td>
                            <td className="py-4 text-green-600">{course.present || 0}</td>
                            <td className="py-4 text-red-600">{course.absent || 0}</td>
                            <td className="py-4 text-yellow-600">{course.late || 0}</td>
                            <td className="py-4 text-sm">{course.professor || 'Unknown'}</td>
                            <td className="py-4 text-sm">{course.room || 'Unknown'}</td>
                            <td className="py-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      percentage >= 90 ? 'bg-green-500' :
                                      percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span>{percentage}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Student Performance */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center">
                    <FiBarChart2 className={`mr-2 ${theme.text}`} />
                    Student Performance
                  </h2>
                  <button className={`text-xs sm:text-sm ${theme.text} font-medium flex items-center`}>
                    View All <FiChevronRight className="ml-1" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {(dashboardData.studentPerformance || []).map((course, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover="hover"
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{course.course || 'Unknown Course'}</h3>
                      <div className="flex justify-between mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm text-gray-600">Average Grade:</span>
                        <span className="font-medium text-sm sm:text-base">{course.avgGrade || 0}%</span>
                      </div>
                      <div className="flex justify-between mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm text-gray-600">Top Performer:</span>
                        <span className="font-medium text-sm sm:text-base">{course.topPerformer || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Improvement:</span>
                        <span className={`font-medium text-sm sm:text-base ${
                          (course.improvement || '').startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {course.improvement || '0%'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Total Department Activities Tab */}
          {activeTab === 'totalActivities' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center min-h-[400px]"
            >
              <motion.div
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <FiActivity className="text-red-600 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
                <p className="text-gray-600 text-lg">Total Department Activities feature is under development.</p>
              </motion.div>
            </motion.div>
          )}

          {/* Ongoing Department Activities Tab */}
          {activeTab === 'ongoingActivities' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center min-h-[400px]"
            >
              <motion.div
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <FiActivity className="text-red-600 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
                <p className="text-gray-600 text-lg">Ongoing Department Activities feature is under development.</p>
              </motion.div>
            </motion.div>
          )}

          {/* Faculty Tab */}
          {activeTab === 'faculty' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Department Faculty List */}
              <motion.div
                ref={nonTeachingStaffRef}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-4 sm:mb-6"
              >
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center">
                    <FiUsers className={`mr-2 ${theme.text}`} />
                    Department Faculty ({facultyMembers.length})
                  </h2>
                </div>
                {facultyMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No faculty members found in your department.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block sm:hidden space-y-3">
                      {facultyMembers.map((faculty) => {
                        const logsForFaculty = facultyLogs.filter(log => log.erp_id === faculty.erpid);
                        let lastLocation = 'N/A';
                        if (logsForFaculty.length > 0) {
                          logsForFaculty.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                          lastLocation = logsForFaculty[0].classroom || 'N/A';
                        }
                        return (
                          <motion.div
                            key={faculty.id}
                            variants={itemVariants}
                            className="border border-gray-200 rounded-lg p-3 hover:bg-red-50 cursor-pointer"
                            whileHover={{ x: 5 }}
                            onClick={() => handlePersonClick('faculty', faculty.id, faculty.name)}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{faculty.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">ERP: {faculty.erpid || 'N/A'}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div>Email: {faculty.email || 'N/A'}</div>
                                <div>Last Location: {lastLocation}</div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                            <th className="pb-3">ERP ID</th>
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Email</th>
                            <th className="pb-3">Last Active Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {facultyMembers.map((faculty) => {
                            const logsForFaculty = facultyLogs.filter(log => log.erp_id === faculty.erpid);
                            let lastLocation = 'N/A';
                            if (logsForFaculty.length > 0) {
                              logsForFaculty.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                              lastLocation = logsForFaculty[0].classroom || 'N/A';
                            }
                            return (
                              <motion.tr
                                key={faculty.id}
                                variants={itemVariants}
                                className="border-b border-gray-100 hover:bg-red-50 cursor-pointer"
                                whileHover={{ x: 5 }}
                                onClick={() => handlePersonClick('faculty', faculty.id, faculty.name)}
                              >
                                <td className="py-4 font-medium">{faculty.erpid || 'N/A'}</td>
                                <td className="py-4">{faculty.name || 'Unknown'}</td>
                                <td className="py-4">{faculty.email || 'N/A'}</td>
                                <td className="py-4">{lastLocation}</td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Non-Teaching Staff Tab */}
          {activeTab === 'nonteaching' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                ref={nonTeachingStaffRef}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-4 sm:mb-6"
              >
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center">
                    <FiUsers className={`mr-2 ${theme.text}`} />
                    Non-Teaching Staff ({nonTeachingStaff.length})
                  </h2>
                </div>
                {nonTeachingStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No non-teaching staff found in your department.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block sm:hidden space-y-3">
                      {nonTeachingStaff.map((staff) => (
                        <motion.div
                          key={staff.id}
                          variants={itemVariants}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-red-50 cursor-pointer"
                          whileHover={{ x: 5 }}
                          onClick={() => handlePersonClick('staff', staff.id, staff.name)}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">{staff.name || 'Unknown'}</span>
                              <span className="text-xs text-gray-500">ERP: {staff.erpid || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <div>Email: {staff.email || 'N/A'}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                            <th className="pb-3">ERP ID</th>
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nonTeachingStaff.map((staff) => (
                            <motion.tr
                              key={staff.id}
                              variants={itemVariants}
                              className="border-b border-gray-100 hover:bg-red-50 cursor-pointer"
                              whileHover={{ x: 5 }}
                              onClick={() => handlePersonClick('staff', staff.id, staff.name)}
                            >
                              <td className="py-4 font-medium">{staff.erpid || 'N/A'}</td>
                              <td className="py-4">{staff.name || 'Unknown'}</td>
                              <td className="py-4">{staff.email || 'N/A'}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Faculty Modal */}
          <AnimatePresence>
            {showFacultyModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
                onClick={() => setShowFacultyModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-3 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center">
                      <FiUsers className="mr-2 text-red-600" />
                      Department Faculty Members ({facultyMembers.length})
                    </h2>
                    <button
                      onClick={() => setShowFacultyModal(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <FiX size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  
                  <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-6rem)] sm:max-h-[calc(80vh-8rem)]">
                    {facultyMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No faculty members found in your department.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {facultyMembers.map((faculty) => (
                          <motion.div
                            key={faculty.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-red-50 transition-colors"
                          >
                            <div className="font-semibold text-base sm:text-lg mb-2">{faculty.name || 'N/A'}</div>
                            <div className="text-xs sm:text-sm text-gray-600 mb-1">ERP ID: {faculty.erpid || 'N/A'}</div>
                            <div className="text-xs sm:text-sm text-gray-600 mb-1">{faculty.email || 'N/A'}</div>
                            <div className="flex items-center mt-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                faculty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {faculty.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                Joined: {faculty.created_at ? new Date(faculty.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Modal */}
          <AnimatePresence>
            {showProfileModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
                onClick={() => setShowProfileModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-3 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center">
                      {selectedPerson?.name || (selectedPerson?.type === 'faculty' ? 'Faculty' : 'Non-Teaching Staff')} Logs
                    </h2>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <FiX size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-6rem)] sm:max-h-[calc(90vh-8rem)]">
                    <FacultyLogDisplay logs={profileLogs || []} loading={profileLoading} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks Modal */}
          <AnimatePresence>
            {showTasksModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
                onClick={() => setShowTasksModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-3 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center">
                      <FiBook className="mr-2 text-red-600" /> Assigned Tasks
                    </h2>
                    <button
                      onClick={() => setShowTasksModal(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <FiX size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-6rem)] sm:max-h-[calc(80vh-8rem)]">
                    {loadingTaskHistory ? (
                      <div className="text-gray-500 text-sm">Loading...</div>
                    ) : assignedTasks.length === 0 ? (
                      <div className="text-gray-500 text-sm">No current tasks.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {assignedTasks.map((task, idx) => (
                          <li key={task.id || idx} className="py-3 cursor-pointer" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                            {/* Show only heading, assigned faculties with status, deadline, and created date */}
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-lg text-red-800 mb-1">{task.heading || 'No Heading'}</div>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                <span className="font-semibold">Assigned Faculties:</span>
                                <ul className="ml-2 list-disc">
                                  {task.facultyAssignments && task.facultyAssignments.length > 0 ? (
                                    task.facultyAssignments.map((fa, i) => (
                                      <li key={i} className="text-red-800">
                                        {fa.name} <span className="text-gray-600 italic">({fa.status})</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-gray-400">N/A</li>
                                  )}
                                </ul>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {task.deadline && (
                                  <span className="mr-4">Deadline: <span className="font-semibold">{new Date(task.deadline).toLocaleDateString()}</span></span>
                                )}
                                {task.createdAt && (
                                  <span>Created: <span className="font-semibold">{new Date(task.createdAt).toLocaleString()}</span></span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Tasks Modal */}
          <AnimatePresence>
            {showPendingTasksModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
                onClick={() => setShowPendingTasksModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-3 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center">
                      <FiBook className="mr-2 text-red-600" /> Pending Tasks
                    </h2>
                    <button
                      onClick={() => setShowPendingTasksModal(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <FiX size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-6rem)] sm:max-h-[calc(80vh-8rem)]">
                    {loadingTaskHistory ? (
                      <div className="text-gray-500 text-sm">Loading...</div>
                    ) : pendingTasks.length === 0 ? (
                      <div className="text-gray-500 text-sm">No pending tasks.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {pendingTasks.map((task, idx) => (
                          <li key={task.id || idx} className="py-3 cursor-pointer">
                            {/* Show only heading, assigned faculties with status, deadline, and created date */}
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-lg text-red-800 mb-1">{task.heading || 'No Heading'}</div>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                <span className="font-semibold">Assigned Faculties:</span>
                                <ul className="ml-2 list-disc">
                                  {task.facultyAssignments && task.facultyAssignments.length > 0 ? (
                                    task.facultyAssignments.map((fa, i) => (
                                      <li key={i} className="text-red-800">
                                        {fa.name} <span className="text-gray-600 italic">({fa.status})</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-gray-400">N/A</li>
                                  )}
                                </ul>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {task.deadline && (
                                  <span className="mr-4">Deadline: <span className="font-semibold">{new Date(task.deadline).toLocaleDateString()}</span></span>
                                )}
                                {task.createdAt && (
                                  <span>Created: <span className="font-semibold">{new Date(task.createdAt).toLocaleString()}</span></span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      {isMobile && <MobileBottomTabsHOD onLogout={handleLogout} />}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Logout</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelLogout} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded bg-[#b22b2f] text-white hover:bg-[#a02529]">Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function RecentFacultyLogs({ facultyMembers = [], handlePersonClick }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://82.112.238.4:9000/api/hod/recent-faculty-logs', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        if (isMounted) setLogs(data);
      } catch (err) {
        if (isMounted) setError('Failed to load logs');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 600000); // 10 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 h-full">
      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center">
        <FiUserCheck className="mr-2 text-red-800" /> Recent Faculty Logs
      </h3>
      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500 text-sm">No logs found.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {logs.map((log, idx) => (
            <li key={log.id || idx} className="py-2 sm:py-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span
                  className="font-medium text-gray-900 cursor-pointer text-sm sm:text-base"
                  onClick={() => {
                    let facultyId = log.faculty_id;
                    let facultyName = log.person_name;
                    if (!facultyId && log.erp_id && Array.isArray(facultyMembers)) {
                      const found = facultyMembers.find(f => f.erpid === log.erp_id);
                      if (found) facultyId = found.id;
                    }
                    if (facultyId) handlePersonClick('faculty', facultyId, facultyName);
                  }}
                >
                  {log.person_name || 'Unknown Faculty'}
                </span>
                <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">Location: {log.classroom || 'N/A'} | IP: {log.camera_ip || 'N/A'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentLeaveApprovals() {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // id of leave being processed

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://82.112.238.4:9000/api/hod/leave-approval');
        setLeaveApplications(Array.isArray(res.data) ? res.data.filter(app => app.HodApproval === 'Pending').slice(0, 5) : []);
      } catch (err) {
        setError('Could not load leave requests');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const handleAction = async (application, action) => {
    setActionLoading(application.ErpStaffId);
    try {
      await axios.put(`http://82.112.238.4:9000/api/hod/leave-approval/${application.ErpStaffId}`, {
        HodApproval: action === 'approve' ? 'Approved' : 'Rejected',
      });
      setLeaveApplications(prev => prev.filter(app => app.ErpStaffId !== application.ErpStaffId));
    } catch (err) {
      alert('Failed to update leave status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 h-full">
      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center">
        <FiBook className="mr-2 text-red-800" /> Recent Leave Approval Requests
      </h3>
      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : leaveApplications.length === 0 ? (
        <div className="text-gray-500 text-sm">No pending leave requests.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {leaveApplications.map((app, idx) => (
            <li key={app.ErpStaffId || idx} className="py-2 sm:py-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm sm:text-base">{app.StaffName}</span>
                <span className="text-xs text-gray-500">{app.leaveType}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">{app.fromDate} to {app.toDate}</div>
              <div className="flex gap-2 mt-2">
                <button
                  className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-xs disabled:opacity-50"
                  disabled={actionLoading === app.ErpStaffId}
                  onClick={() => handleAction(app, 'approve')}
                >
                  <Check size={12} className="sm:w-[14px] sm:h-[14px] mr-1" /> Approve
                </button>
                <button
                  className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-xs disabled:opacity-50"
                  disabled={actionLoading === app.ErpStaffId}
                  onClick={() => handleAction(app, 'reject')}
                >
                  <X size={12} className="sm:w-[14px] sm:h-[14px] mr-1" /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HODDashboard;       
            