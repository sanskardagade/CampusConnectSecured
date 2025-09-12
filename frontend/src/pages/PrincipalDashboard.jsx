import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FiUsers, FiUser, FiBook, FiBriefcase, 
  FiChevronDown, FiChevronRight, FiRefreshCw,
  FiMail, FiCalendar, FiActivity, FiBarChart2,
  FiSearch, FiX, FiDownload
} from 'react-icons/fi';
import ProfileView from './ProfileView';
import FacultyLogDisplay from '../components/faculty/FacultyLogDisplay';
import dayjs from 'dayjs';
import HeaderPrincipal from '../components/common/HeaderPrincipal';
import { useNavigate } from 'react-router-dom';

const PrincipalDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    departments: 0,
    students: 0,
    faculty: 0,
    staff: 0
  });
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [facultyLogs, setFacultyLogs] = useState([]);
  const [showFacultyLogs, setShowFacultyLogs] = useState(false);
  const [facultyLogsLoading, setFacultyLogsLoading] = useState(false);
  const [staffLogs, setStaffLogs] = useState([]);
  const [showStaffLogs, setShowStaffLogs] = useState(false);
  const [staffLogsLoading, setStaffLogsLoading] = useState(false);
  const departmentsRef = useRef(null);
  const memberTypeRef = useRef(null);
  const [showStudentUnavailable, setShowStudentUnavailable] = useState(false);
  const [reportDept, setReportDept] = useState('all');
  const [downloading, setDownloading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [presentFaculty, setPresentFaculty] = useState(0);
  const [presentStaff, setPresentStaff] = useState(0);
  const [showPresentFacultyModal, setShowPresentFacultyModal] = useState(false);
  const [showPresentStaffModal, setShowPresentStaffModal] = useState(false);
  const [presentFacultyList, setPresentFacultyList] = useState([]);
  const [presentStaffList, setPresentStaffList] = useState([]);
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('all');
  const [staffDeptFilter, setStaffDeptFilter] = useState('all');
  const [selectedDeptFilters, setSelectedDeptFilters] = useState(['all']);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);
  const [selectedStaffDeptFilters, setSelectedStaffDeptFilters] = useState(['all']);
  const [staffDeptDropdownOpen, setStaffDeptDropdownOpen] = useState(false);
  const staffDeptDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [facultyDeptTotals, setFacultyDeptTotals] = useState({});
  const [staffDeptTotals, setStaffDeptTotals] = useState({});
  const [facultyListRefreshing, setFacultyListRefreshing] = useState(false);
  const [staffListRefreshing, setStaffListRefreshing] = useState(false);
  const [branchPdfLoading, setBranchPdfLoading] = useState(null);
  const [staffBranchPdfLoading, setStaffBranchPdfLoading] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingLeaves();
    fetchTodayPresence();
    fetchPresentFacultyStaffSummary();
    fetchFacultyDeptTotals();
    fetchStaffDeptTotals();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setDeptDropdownOpen(false);
      }
    }
    if (deptDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [deptDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (staffDeptDropdownRef.current && !staffDeptDropdownRef.current.contains(event.target)) {
        setStaffDeptDropdownOpen(false);
      }
    }
    if (staffDeptDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [staffDeptDropdownOpen]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://69.62.83.14:9000/api/principal/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
      setDepartments(response.data.departments);
      resetSelections();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://69.62.83.14:9000/api/principal/faculty-leave-approval', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pending = (res.data || []).filter(l => l.PrincipalApproval === 'Pending').length;
      setPendingLeaves(pending);
    } catch (e) {
      setPendingLeaves(0);
    }
  };

  const fetchTodayPresence = async () => {
    try {
      const token = localStorage.getItem('token');
      // Faculty logs
      const facultyRes = await axios.get('http://69.62.83.14:9000/api/principal/faculty-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const today = dayjs().format('YYYY-MM-DD');
      const facultyToday = new Set();
      (facultyRes.data.logs || []).forEach(log => {
        if (dayjs(log.timestamp).format('YYYY-MM-DD') === today) {
          facultyToday.add(log.erp_id);
        }
      });
      setPresentFaculty(facultyToday.size);
      // Staff logs
      const staffRes = await axios.get('http://69.62.83.14:9000/api/principal/staff-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffToday = new Set();
      (staffRes.data.logs || []).forEach(log => {
        if (dayjs(log.timestamp).format('YYYY-MM-DD') === today) {
          staffToday.add(log.erp_id);
        }
      });
      setPresentStaff(staffToday.size);
      // Students: fetch from backend endpoint
      const studentRes = await axios.get('http://69.62.83.14:9000/api/principal/student-attendance-today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPresentStudents(studentRes.data.count || 0);
    } catch (e) {
      setPresentFaculty(0);
      setPresentStaff(0);
      setPresentStudents(0);
    }
  };

  const fetchPresentFacultyStaffSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://69.62.83.14:9000/api/principal/present-faculty-staff-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Find today's date in the summary
      const today = dayjs().format('YYYY-MM-DD');
      const facultyToday = (res.data.faculty || []).find(row => dayjs(row.date).format('YYYY-MM-DD') === today);
      const staffToday = (res.data.staff || []).find(row => dayjs(row.date).format('YYYY-MM-DD') === today);
      setPresentFaculty(facultyToday ? facultyToday.total_faculty_present : 0);
      setPresentStaff(staffToday ? staffToday.total_staff_present : 0);
    } catch (e) {
      setPresentFaculty(0);
      setPresentStaff(0);
    }
  };

  const resetSelections = () => {
    setSelectedDept(null);
    setSelectedType(null);
    setMembers([]);
    setSelectedMember(null);
    setProfileData(null);
    setSearchTerm('');
    setIsSearching(false);
    setShowMembersList(false);
  };

  const fetchAllMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://69.62.83.14:9000/api/principal/all-members',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(response.data.members);
    } catch (err) {
      console.error('Error fetching all members:', err);
    }
  };

  const fetchDepartmentMembers = async (deptId, type) => {
    try {
      setSelectedType(type);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://69.62.83.14:9000/api/principal/members?deptId=${deptId}&type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(response.data.members);
      setShowMembersList(true);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchMemberProfile = async (memberId) => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://69.62.83.14:9000/api/principal/profile/${memberId}?type=${selectedType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(response.data);
      setSelectedMember(memberId);
      if (selectedType === 'faculty') {
        setFacultyLogsLoading(true);
        setShowFacultyLogs(false);
        try {
          const logsRes = await axios.get(
            `http://69.62.83.14:9000/api/principal/faculty-logs/${memberId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setFacultyLogs(logsRes.data.logs || []);
          setShowFacultyLogs(true);
        } catch (e) {
          setFacultyLogs([]);
        } finally {
          setFacultyLogsLoading(false);
        }
      } else if (selectedType === 'staff') {
        setStaffLogsLoading(true);
        setShowStaffLogs(false);
        try {
          const logsRes = await axios.get(
            `http://69.62.83.14:9000/api/principal/staff-logs/${memberId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStaffLogs(logsRes.data.logs || []);
          setShowStaffLogs(true);
        } catch (e) {
          setStaffLogs([]);
        } finally {
          setStaffLogsLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDept(deptId);
    setSelectedType(null);
    setMembers([]);
    setSelectedMember(null);
    setProfileData(null);
    setShowMembersList(false);
    setTimeout(() => {
      if (memberTypeRef.current) {
        memberTypeRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsSearching(term.length > 0);
    
    if (term.length > 0 && !selectedDept) {
      fetchAllMembers();
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.erpid && member.erpid.toString().includes(searchTerm))
  );

  const handleScrollToDepartments = () => {
    if (departmentsRef.current) {
      departmentsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToMemberType = () => {
    if (!selectedDept && departments.length > 0) {
      handleDepartmentSelect(departments[0].id);
      setTimeout(() => {
        if (memberTypeRef.current) {
          memberTypeRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } else {
      if (memberTypeRef.current) {
        memberTypeRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleShowStudentUnavailable = () => {
    setShowStudentUnavailable(true);
    setTimeout(() => setShowStudentUnavailable(false), 3000);
  };

  const handleDownloadAttendance = async (format) => {
    setDownloading(true);
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://69.62.83.14:9000/api/principal/faculty-attendance-report', {
            headers: { Authorization: `Bearer ${token}` },
            params: { departmentId: reportDept, fromDate, toDate, format },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const departmentName = reportDept === 'all' ? 'all' : departments.find(d => d.id === parseInt(reportDept, 10))?.name.replace(/\s+/g, '_');
        const ext = format === 'pdf' ? 'pdf' : 'csv';
        const filename = `faculty_attendance_report_${departmentName}_${new Date().toISOString().split('T')[0]}.${ext}`;
        link.setAttribute('download', filename);

        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

    } catch (err) {
        console.error('Error downloading attendance report:', err);
    } finally {
        setDownloading(false);
    }
  };

  // Handler to fetch and show present faculty modal
  const fetchPresentFacultyList = async () => {
    setFacultyListRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://69.62.83.14:9000/api/principal/present-faculty-today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const facultyList = res.data.presentFaculty || [];
      setPresentFacultyList(facultyList);
      
      // Update the external count to stay in sync
      setPresentFaculty(facultyList.length);
    } catch (e) {
      setPresentFacultyList([]);
      setPresentFaculty(0);
    } finally {
      setFacultyListRefreshing(false);
    }
  };

  const handleShowPresentFaculty = async () => {
    setShowPresentFacultyModal(true);
    fetchPresentFacultyList();
  };

  // Handler to fetch and show present staff modal
  const fetchPresentStaffList = async () => {
    setStaffListRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://69.62.83.14:9000/api/principal/present-staff-today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffList = res.data.presentStaff || [];
      setPresentStaffList(staffList);
      
      // Update the external count to stay in sync
      setPresentStaff(staffList.length);
    } catch (e) {
      setPresentStaffList([]);
      setPresentStaff(0);
    } finally {
      setStaffListRefreshing(false);
    }
  };

  const handleShowPresentStaff = async () => {
    setShowPresentStaffModal(true);
    fetchPresentStaffList();
  };

  // Handler for navigating to faculty leave approval
  const handleNavigateLeaveApproval = () => {
    navigate('/principal/faculty-leave-approval');
  };

  // Fetch faculty totals per department
  const fetchFacultyDeptTotals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://69.62.83.14:9000/api/principal/faculty-department-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Convert to map: { department_id: count }
      const map = {};
      (res.data || []).forEach(row => {
        map[row.department_id] = Number(row.count);
      });
      setFacultyDeptTotals(map);
    } catch (e) {
      setFacultyDeptTotals({});
    }
  };

  // Fetch staff totals per department
  const fetchStaffDeptTotals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://69.62.83.14:9000/api/principal/staff-department-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Convert to map: { department_id: count }
      const map = {};
      (res.data || []).forEach(row => {
        map[row.department_id] = Number(row.count);
      });
      setStaffDeptTotals(map);
    } catch (e) {
      setStaffDeptTotals({});
    }
  };

  // Function to preview PDF for a department
  const handlePreviewFacultyPdf = async (deptId) => {
    setBranchPdfLoading(deptId);
    try {
      const token = localStorage.getItem('token');
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('http://69.62.83.14:9000/api/principal/faculty-attendance-report', {
        headers: { Authorization: `Bearer ${token}` },
        params: { departmentId: deptId, format: 'pdf', fromDate: today, toDate: today },
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      alert('Failed to preview PDF for this branch.');
    } finally {
      setBranchPdfLoading(null);
    }
  };

  // Function to preview PDF for a staff department
  const handlePreviewStaffPdf = async (deptId) => {
    setStaffBranchPdfLoading(deptId);
    try {
      const token = localStorage.getItem('token');
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('http://69.62.83.14:9000/api/principal/staff-attendance-report', {
        headers: { Authorization: `Bearer ${token}` },
        params: { departmentId: deptId, format: 'pdf', fromDate: today, toDate: today },
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      alert('Failed to preview PDF for this branch.');
    } finally {
      setStaffBranchPdfLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-red-600"
        >
          <FiRefreshCw size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <HeaderPrincipal />
     
      <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.div 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600">Dr. D. Y. Patil Institute of Technology, Pimpri, Pune</p>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              <FiRefreshCw className="text-red-600" />
              <span>Refresh Data</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <button
            onClick={handleScrollToDepartments}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiBook size={20} />}
              title="Departments"
              value={stats.departments}
              color="from-red-700 to-red-900"
              delay={0.1}
            />
          </button>
          <button
            onClick={handleShowStudentUnavailable}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiUsers size={20} />}
              title="Students"
              value="3000+"
              color="from-red-700 to-red-900"
              delay={0.2}
            />
          </button>
          <button
            onClick={handleScrollToMemberType}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiUser size={20} />}
              title="Faculty"
              value={stats.faculty}
              color="from-red-700 to-red-900"
              delay={0.3}
            />
          </button>
          <button
            onClick={handleScrollToMemberType}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiBriefcase size={20} />}
              title="Non-Teaching Staff"
              value={stats.staff}
              color="from-red-700 to-red-900"
              delay={0.4}
            />
          </button>
        </motion.div>

        {/* Live Overview */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <button
            onClick={handleNavigateLeaveApproval}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiBook size={20} />}
              title="Pending Leave Approvals"
              value={pendingLeaves}
              color="from-red-700 to-red-900"
              delay={0.1}
            />
          </button>
          <StatCard 
            icon={<FiUsers size={20} />}
            title="Present Students"
            value={presentStudents}
            color="from-red-700 to-red-900"
            delay={0.2}
          />
          <button
            onClick={handleShowPresentFaculty}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiUser size={20} />}
              title="Present Faculty"
              value={presentFaculty}
              color="from-red-700 to-red-900"
              delay={0.3}
            />
          </button>
          <button
            onClick={handleShowPresentStaff}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <StatCard 
              icon={<FiBriefcase size={20} />}
              title="Present Non-Teaching Staff"
              value={presentStaff}
              color="from-red-700 to-red-900"
              delay={0.4}
            />
          </button>
        </motion.div>

        {showStudentUnavailable && (
          <div className="mb-4 text-center text-red-700 font-semibold bg-red-50 border border-red-200 rounded p-3 animate-fadeIn">
            Currently the students data is unavailable
          </div>
        )}

        {/* Search Bar
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-6"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or ERP ID (works without department selection)"
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsSearching(false);
                if (!selectedDept) setMembers([]);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <FiX className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </motion.div> */}

        {/* Department Selection - Vertical */}
        <motion.div 
          ref={departmentsRef}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Departments</h3>
            <span className="text-sm text-gray-500">
              {selectedDept ? departments.find(d => d.id === selectedDept)?.name : 'Select a department'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
            {departments.map((dept) => (
              <motion.button
                key={dept.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDepartmentSelect(dept.id)}
                className={`flex-shrink-0 m-2 p-3 rounded-lg flex flex-col items-center transition-all ${
                  selectedDept === dept.id 
                    ? 'bg-red-100 border-2 border-red-500 shadow-md' 
                    : 'bg-gray-50 border border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-2 transition-colors ${
                  selectedDept === dept.id 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <FiBook size={16} />
                </div>
                <span className="text-sm font-medium text-center max-w-[120px] whitespace-normal break-words">
                  {dept.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Member Type Selection */}
        {selectedDept && (
          <motion.div 
            ref={memberTypeRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4 overflow-hidden"
          >
            <div className="w-full p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Member Type</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              <MemberTypeButton
                active={selectedType === 'students'}
                onClick={() => fetchDepartmentMembers(selectedDept, 'students')}
                icon={<FiUsers size={16} />}
                label="Students"
                color="bg-[#b22b2f]"
              />
              <MemberTypeButton
                active={selectedType === 'faculty'}
                onClick={() => fetchDepartmentMembers(selectedDept, 'faculty')}
                icon={<FiUser size={16} />}
                label="Faculty"
                color="bg-[#b22b2f]"
              />
              <MemberTypeButton
                active={selectedType === 'staff'}
                onClick={() => fetchDepartmentMembers(selectedDept, 'staff')}
                icon={<FiBriefcase size={16} />}
                label="Non-Teaching Staff"
                color="bg-[#b22b2f]"
              />
            </div>
            {/* Search Bar inside Member Type */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative mb-6 px-3"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or ERP ID (works without department selection)"
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setIsSearching(false);
                    if (!selectedDept) setMembers([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FiX className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Members List */}
        {(selectedType || isSearching) && (members.length > 0 || isSearching) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden"
          >
            <button
              onClick={() => setShowMembersList(!showMembersList)}
              className="w-full p-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50"
            >
              <div className="flex items-center">
                <h3 className="font-bold text-gray-900 mr-2">
                  {selectedType 
                    ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Members` 
                    : 'Search Results'}
                </h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {filteredMembers.length} {filteredMembers.length === 1 ? 'item' : 'Strength'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: showMembersList ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="text-gray-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showMembersList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <motion.div
                          key={member.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 cursor-pointer transition-colors ${
                            selectedMember === member.id 
                              ? 'bg-red-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => fetchMemberProfile(member.id)}
                        >
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              selectedType === 'students' ? 'bg-[#d1a550] text-white' :
                              selectedType === 'faculty' ? 'bg-red-100 text-red-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              {selectedType === 'students' ? <FiUsers size={14} /> :
                               selectedType === 'faculty' ? <FiUser size={14} /> :
                               <FiBriefcase size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{member.name}</h4>
                              <div className="flex items-center text-sm text-gray-600">
                                <FiMail className="mr-1 flex-shrink-0" size={12} />
                                <span className="truncate">{member.email}</span>
                              </div>
                              {member.erpid && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ERP ID: {member.erpid}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No matching {selectedType || 'members'} found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Profile View */}
        <AnimatePresence mode="wait">
          {profileData ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200"
            >
              <ProfileView 
                data={profileData} 
                type={selectedType} 
                loading={profileLoading} 
              />
              {selectedType === 'faculty' && showFacultyLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[100vh] overflow-y-auto relative p-6">
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold"
                      onClick={() => setShowFacultyLogs(false)}
                    >
                      &times;
                    </button>
                    <h2 className="text-xl font-bold mb-4 text-red-700">Faculty Attendance Logs</h2>
                    {facultyLogsLoading ? (
                      <div className="text-center py-8 text-gray-400">Loading logs...</div>
                    ) : (
                      <FacultyLogDisplay logs={facultyLogs} />
                    )}
                  </div>
                </div>
              )}
              {selectedType === 'staff' && showStaffLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[100vh] overflow-y-auto relative p-6">
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold"
                      onClick={() => setShowStaffLogs(false)}
                    >
                      &times;
                    </button>
                    <h2 className="text-xl font-bold mb-4 text-purple-700">Staff Activity Logs</h2>
                    {staffLogsLoading ? (
                      <div className="text-center py-8 text-gray-400">Loading logs...</div>
                    ) : (
                      <FacultyLogDisplay logs={staffLogs} />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 h-64 flex items-center justify-center"
            >
              <div className="text-center p-8">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
                >
                  <FiUser className="text-gray-400" size={24} />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Profile Selected</h3>
                <p className="text-gray-500">
                  {selectedType 
                    ? `Select a ${selectedType.slice(0, -1)} to view details` 
                    : "Select a member to view profile"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Download Reports</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <label htmlFor="report-dept" className="block text-sm font-medium text-gray-700 mb-1">
                Select Department
              </label>
              <select
                id="report-dept"
                value={reportDept}
                onChange={(e) => setReportDept(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 mt-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    max={toDate || undefined}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min={fromDate || undefined}
                  />
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto mt-auto flex gap-2">
              <button
                onClick={() => handleDownloadAttendance('csv')}
                disabled={downloading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                <FiDownload />
                <span>{downloading ? 'Downloading CSV...' : 'Download CSV'}</span>
              </button>
              <button
                onClick={() => handleDownloadAttendance('pdf')}
                disabled={downloading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                <FiDownload />
                <span>{downloading ? 'Downloading PDF...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        </motion.div> */}
      </div>

      {/* Present Faculty Modal */}
      <AnimatePresence>
        {showPresentFacultyModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold"
                onClick={() => setShowPresentFacultyModal(false)}
              >
                &times;
              </button>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-red-700">Present Faculty Today</h2>
                <button
                  className="ml-2 p-2 rounded-full hover:bg-gray-100 text-red-700"
                  onClick={fetchPresentFacultyList}
                  title="Refresh"
                  disabled={facultyListRefreshing}
                >
                  <FiRefreshCw size={20} className={facultyListRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              {/* Branch-wise (Department-wise) Count */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Branch-wise Present Faculty Count</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {departments.map(dept => {
                    const presentCount = presentFacultyList.filter(f => {
                      const facDeptId = f.departmentId ?? f.department_id;
                      const facDeptName = f.department_name ?? f.departmentName;
                      return (
                        (facDeptId !== undefined && facDeptId !== null && Number(facDeptId) === Number(dept.id)) ||
                        (facDeptName && facDeptName.trim().toLowerCase() === dept.name.trim().toLowerCase())
                      );
                    }).length;
                    const totalCount = facultyDeptTotals[dept.id] || 0;
                    const isClickable = totalCount > 0;
                    return (
                      <li
                        key={dept.id}
                        className={`flex justify-between bg-gray-50 rounded p-2 transition-colors ${
                          isClickable ? 'cursor-pointer hover:bg-red-100' : 'opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => isClickable && handlePreviewFacultyPdf(dept.id)}
                        title={isClickable ? 'Preview PDF for this branch' : 'No data to preview'}
                      >
                        <span>{dept.name}</span>
                        <span className="font-bold flex items-center gap-1">
                          {presentCount}/{totalCount}
                          {branchPdfLoading === dept.id && (
                            <FiRefreshCw className="animate-spin ml-1" size={16} />
                          )}
                        </span>
                      </li>
                    );
                  })}
                  {/* Show N/A group if any */}
                  {presentFacultyList.filter(f => {
                    const facDeptId = f.departmentId ?? f.department_id;
                    const facDeptName = f.department_name ?? f.departmentName;
                    return (!facDeptId && (!facDeptName || facDeptName === 'N/A' || facDeptName === 'Unknown'));
                  }).length > 0 && (
                    <li className="flex justify-between bg-gray-50 rounded p-2 opacity-60 cursor-not-allowed">
                      <span>Unknown / N/A</span>
                      <span className="font-bold">{presentFacultyList.filter(f => {
                        const facDeptId = f.departmentId ?? f.department_id;
                        const facDeptName = f.department_name ?? f.departmentName;
                        return (!facDeptId && (!facDeptName || facDeptName === 'N/A' || facDeptName === 'Unknown'));
                      }).length}</span>
                    </li>
                  )}
                  {/* Summary row for total present/total faculty */}
                  <li
                    className={`flex justify-between bg-red-100 rounded p-2 font-bold mt-2 col-span-2 cursor-pointer hover:bg-red-200 transition-colors ${branchPdfLoading === 'all' ? 'opacity-70' : ''}`}
                    onClick={() => handlePreviewFacultyPdf('all')}
                    title="Preview PDF for all faculties present today"
                  >
                    <span>Total</span>
                    <span className="flex items-center gap-1">
                      {departments.reduce((sum, dept) => {
                        return sum + presentFacultyList.filter(f => {
                          const facDeptId = f.departmentId ?? f.department_id;
                          const facDeptName = f.department_name ?? f.departmentName;
                          return (
                            (facDeptId !== undefined && facDeptId !== null && Number(facDeptId) === Number(dept.id)) ||
                            (facDeptName && facDeptName.trim().toLowerCase() === dept.name.trim().toLowerCase())
                          );
                        }).length;
                      }, 0)}
                      /
                      {departments.reduce((sum, dept) => sum + (facultyDeptTotals[dept.id] || 0), 0)}
                      {branchPdfLoading === 'all' && (
                        <FiRefreshCw className="animate-spin ml-1" size={16} />
                      )}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  className="px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition-colors shadow"
                  onClick={() => { setShowPresentFacultyModal(false); navigate('/principal/faculty-report'); }}
                >
                 Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Present Staff Modal */}
      <AnimatePresence>
        {showPresentStaffModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-purple-600 text-2xl font-bold"
                onClick={() => setShowPresentStaffModal(false)}
              >
                &times;
              </button>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-700">Present Non-Teaching Staff Today</h2>
                <button
                  className="ml-2 p-2 rounded-full hover:bg-gray-100 text-purple-700"
                  onClick={fetchPresentStaffList}
                  title="Refresh"
                  disabled={staffListRefreshing}
                >
                  <FiRefreshCw size={20} className={staffListRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              {/* Branch-wise (Department-wise) Count for Staff */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Branch-wise Present Non-Teaching Staff Count</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {departments.map(dept => {
                    const presentCount = presentStaffList.filter(s => {
                      const staffDeptId = s.departmentId ?? s.department_id;
                      const staffDeptName = s.department_name ?? s.departmentName;
                      return (
                        (staffDeptId !== undefined && staffDeptId !== null && Number(staffDeptId) === Number(dept.id)) ||
                        (staffDeptName && staffDeptName.trim().toLowerCase() === dept.name.trim().toLowerCase())
                      );
                    }).length;
                    const totalCount = staffDeptTotals[dept.id] || 0;
                    const isClickable = totalCount > 0;
                    return (
                      <li
                        key={dept.id}
                        className={`flex justify-between bg-gray-50 rounded p-2 transition-colors ${
                          isClickable ? 'cursor-pointer hover:bg-purple-100' : 'opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => isClickable && handlePreviewStaffPdf(dept.id)}
                        title={isClickable ? 'Preview PDF for this branch' : 'No data to preview'}
                      >
                        <span>{dept.name}</span>
                        <span className="font-bold flex items-center gap-1">
                          {presentCount}/{totalCount}
                          {staffBranchPdfLoading === dept.id && (
                            <FiRefreshCw className="animate-spin ml-1" size={16} />
                          )}
                        </span>
                      </li>
                    );
                  })}
                  {/* Show N/A group if any */}
                  {presentStaffList.filter(s => {
                    const staffDeptId = s.departmentId ?? s.department_id;
                    const staffDeptName = s.department_name ?? s.departmentName;
                    return (!staffDeptId && (!staffDeptName || staffDeptName === 'N/A' || staffDeptName === 'Unknown'));
                  }).length > 0 && (
                    <li className="flex justify-between bg-gray-50 rounded p-2 opacity-60 cursor-not-allowed">
                      <span>Unknown / N/A</span>
                      <span className="font-bold">{presentStaffList.filter(s => {
                        const staffDeptId = s.departmentId ?? s.department_id;
                        const staffDeptName = s.department_name ?? s.departmentName;
                        return (!staffDeptId && (!staffDeptName || staffDeptName === 'N/A' || staffDeptName === 'Unknown'));
                      }).length}</span>
                    </li>
                  )}
                  {/* Summary row for total present/total staff */}
                  <li
                    className={`flex justify-between bg-purple-100 rounded p-2 font-bold mt-2 col-span-2 cursor-pointer hover:bg-purple-200 transition-colors ${staffBranchPdfLoading === 'all' ? 'opacity-70' : ''}`}
                    onClick={() => handlePreviewStaffPdf('all')}
                    title="Preview PDF for all non-teaching staff present today"
                  >
                    <span>Total</span>
                    <span className="flex items-center gap-1">
                      {departments.reduce((sum, dept) => {
                        return sum + presentStaffList.filter(s => {
                          const staffDeptId = s.departmentId ?? s.department_id;
                          const staffDeptName = s.department_name ?? s.departmentName;
                          return (
                            (staffDeptId !== undefined && staffDeptId !== null && Number(staffDeptId) === Number(dept.id)) ||
                            (staffDeptName && staffDeptName.trim().toLowerCase() === dept.name.trim().toLowerCase())
                          );
                        }).length;
                      }, 0)}
                      /
                      {departments.reduce((sum, dept) => sum + (staffDeptTotals[dept.id] || 0), 0)}
                      {staffBranchPdfLoading === 'all' && (
                        <FiRefreshCw className="animate-spin ml-1" size={16} />
                      )}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors shadow"
                  onClick={() => { setShowPresentStaffModal(false); navigate('/principal/faculty-report'); }}
                >
                  Download Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const StatCard = ({ icon, title, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`bg-gradient-to-br ${color} rounded-xl shadow-lg text-white p-4 cursor-pointer transition-all`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <motion.div 
        whileHover={{ rotate: 10 }}
        className="p-2 bg-white bg-opacity-20 rounded-lg"
      >
        {icon}
      </motion.div>
    </div>
  </motion.div>
);

const MemberTypeButton = ({ active, onClick, icon, label, color }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
      active 
        ? `${color} text-white shadow-md` 
        : 'bg-gray-100 text-gray-600 hover:shadow-sm'
    }`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
      active ? 'bg-white bg-opacity-20' : 'bg-white'
    }`}>
      {React.cloneElement(icon, { 
        className: active ? 'text-white' : 'text-current'
      })}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

export default PrincipalDashboard;

<style>{`
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 0.5s;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
`}</style>