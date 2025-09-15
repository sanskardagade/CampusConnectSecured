import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, GraduationCap, Building, Search, RefreshCw, BarChart3, Calendar, User, Clock, TrendingUp, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import HeaderMobile from '../common/HeaderMobile';

function AdminStressDisplay() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [stressData, setStressData] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('faculty');
  const facultyListRef = useRef(null);

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments || []);
      setSelectedDept(null);
      setFaculty([]);
      setSelectedFaculty(null);
      setStressData([]);
    } catch (err) {
      setDepartments([]);
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyOrStaff = async (deptId, type, shouldScroll = false) => {
    setSelectedDept(deptId);
    setSelectedFaculty(null);
    setStressData([]);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/members?deptId=${deptId}&type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const members = response.data.members || [];
      setFaculty(members);
      if (shouldScroll) {
        setTimeout(() => {
          if (facultyListRef.current && members.length > 0) {
            facultyListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      }
      return members;
    } catch (err) {
      setFaculty([]);
      console.error('Error fetching members:', err);
      return [];
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchStressData = async (facultyErpid) => {
    setProfileLoading(true);
    setSelectedFaculty(facultyErpid);
    setStressData([]);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/view-stress-level?facultyId=${facultyErpid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Convert timestamps to Date objects for easier handling
      const data = (response.data || []).map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setStressData(data);
    } catch (err) {
      setStressData([]);
      console.error('Error fetching stress data:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredFaculty = faculty.filter(member =>
    (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.erpid && member.erpid.toString().includes(searchTerm))
  );

  // --- Analytics and Chart Logic ---
  const filteredData = useMemo(() => {
    return stressData.filter(item => {
      const itemDate = item.timestamp.toISOString().split('T')[0];
      return itemDate >= fromDate && itemDate <= toDate;
    });
  }, [stressData, fromDate, toDate]);

  const chartData = useMemo(() => {
    const counts = {
      L1: 0, L2: 0, L3: 0,
      A1: 0, A2: 0, A3: 0
    };
    filteredData.forEach(item => {
      if (counts.hasOwnProperty(item.stress_level)) {
        counts[item.stress_level]++;
      }
    });
    return [
      { level: 'L1', count: counts.L1, type: 'stressed', color: '#7f1d1d' },
      { level: 'L2', count: counts.L2, type: 'stressed', color: '#991b1b' },
      { level: 'L3', count: counts.L3, type: 'stressed', color: '#b91c1c' },
      { level: 'A1', count: counts.A1, type: 'unstress', color: '#22c55e' },
      { level: 'A2', count: counts.A2, type: 'unstress', color: '#4ade80' },
      { level: 'A3', count: counts.A3, type: 'unstress', color: '#86efac' }
    ];
  }, [filteredData]);

  const stats = useMemo(() => {
    const stressed = filteredData.filter(item =>
      typeof item.stress_status === 'string' && item.stress_status.trim().toLowerCase() === 'stressed'
    ).length;
    const active = filteredData.filter(item =>
      typeof item.stress_status === 'string' &&
      ['active', 'unstress'].includes(item.stress_status.trim().toLowerCase())
    ).length;
    const total = filteredData.length;
    return {
      stressed,
      active,
      total,
      stressPercentage: total > 0 ? Math.round((stressed / total) * 100) : 0,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [filteredData]);

  const facultyName = stressData.length > 0 ? stressData[0].name : 'Faculty Member';
  const erpId = stressData.length > 0 ? stressData[0].erpid : '';

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'Stressed') {
      return {
        icon: AlertTriangle,
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
      };
    }
    return {
      icon: CheckCircle,
      className: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
    };
  };

  const getLevelBadge = (level) => {
    const isStressed = level && level.startsWith('L');
    return {
      className: isStressed 
        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg ring-2 ring-red-200' 
        : 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg ring-2 ring-green-200',
      pulse: isStressed
    };
  };

  const handleFacultyClick = (erpid) => {
    fetchStressData(erpid);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFaculty(null);
    setStressData([]);
  };

  if (loading) {
    return (
      <>
        <HeaderMobile title="Stress" />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900">Loading Dashboard...</h3>
            <p className="text-gray-600">Please wait while we fetch the data</p>
          </div>
        </div>
      </>
    );
  }

  // --- Main Render ---
  return (
    <>
      <HeaderMobile title="Stress" />
      <div className="pt-16 px-2 sm:px-4 md:px-8 max-w-6xl mx-auto w-full">
        {/* Glassmorphism Header */}
        <div className="backdrop-blur-xl bg-white/30 rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-red-800 to-red-900 rounded-xl shadow-lg">
                  <BarChart3 className="text-white sm:w-6 sm:h-6" size={20} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-700 bg-clip-text text-transparent">
                    Faculty & Staff Stress Levels
                  </h1>
                  <p className="text-red-700 font-medium text-sm sm:text-base">Department-wise stress monitoring and insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={fetchDepartments}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-800 to-red-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
              >
                <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Department Selection */}
        <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-white/20 shadow-xl overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <GraduationCap className="text-red-800 sm:w-6 sm:h-6" size={20} />
                <h3 className="text-lg sm:text-xl font-bold text-red-900">Departments</h3>
              </div>
              <span className="text-xs sm:text-sm text-red-700 bg-white/50 px-2 sm:px-3 py-1 rounded-full">
                {selectedDept ? departments.find(d => d.id === selectedDept)?.name : 'Select a department'}
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => fetchFacultyOrStaff(dept.id, selectedTab, true)}
                  className={`group p-3 sm:p-4 rounded-xl transition-all duration-300 ${
                    selectedDept === dept.id
                      ? 'bg-gradient-to-r from-red-800 to-red-900 text-white shadow-lg scale-105'
                      : 'bg-white/60 hover:bg-white/80 text-red-900 hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                      selectedDept === dept.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gradient-to-r from-red-800 to-red-900 text-white group-hover:scale-110'
                    }`}>
                                             <Building className="sm:w-5 sm:h-5" size={16} />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">{dept.name}</h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Bar for Faculty/Staff */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-xl bg-white/70 shadow border border-white/30 overflow-hidden">
            <button
              className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold transition-all duration-200 text-sm sm:text-base ${selectedTab === 'faculty' ? 'bg-red-800 text-white shadow' : 'text-red-800 hover:bg-red-100'}`}
              onClick={async () => {
                if (selectedTab === 'faculty') return;
                setSelectedTab('faculty');
                if (selectedDept) {
                  const newList = await fetchFacultyOrStaff(selectedDept, 'faculty', false);
                  if (modalOpen && selectedFaculty) {
                    const found = newList.find(member => member.erpid === selectedFaculty);
                    if (found) {
                      fetchStressData(selectedFaculty);
                    } else {
                      setModalOpen(false);
                      setSelectedFaculty(null);
                      setStressData([]);
                    }
                  }
                }
              }}
            >
              Faculty
            </button>
            <button
              className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold transition-all duration-200 text-sm sm:text-base ${selectedTab === 'staff' ? 'bg-red-900 text-white shadow' : 'text-red-900 hover:bg-red-100'}`}
              onClick={async () => {
                if (selectedTab === 'staff') return;
                setSelectedTab('staff');
                if (selectedDept) {
                  const newList = await fetchFacultyOrStaff(selectedDept, 'staff', false);
                  if (modalOpen && selectedFaculty) {
                    const found = newList.find(member => member.erpid === selectedFaculty);
                    if (found) {
                      fetchStressData(selectedFaculty);
                    } else {
                      setModalOpen(false);
                      setSelectedFaculty(null);
                      setStressData([]);
                    }
                  }
                }
              }}
            >
              Non-Teaching Staff
            </button>
          </div>
        </div>

        {/* Faculty/Staff List */}
        {selectedDept && faculty.length > 0 && (
          <div ref={facultyListRef} className="backdrop-blur-xl bg-white/40 rounded-2xl border border-white/20 shadow-xl mb-6 sm:mb-8 relative">
            {/* Loading overlay when switching tabs or departments */}
            {profileLoading && !modalOpen && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur rounded-2xl">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <span className="text-indigo-700 font-semibold text-lg">Loading...</span>
                </div>
              </div>
            )}
            <div className="p-4 sm:p-6 border-b border-white/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                                     <Users className="text-indigo-600 sm:w-6 sm:h-6" size={20} />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">{selectedTab === 'faculty' ? 'Faculty Members' : 'Non-Teaching Staff'}</h3>
                  <span className="bg-indigo-100 text-indigo-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {filteredFaculty.length} members
                  </span>
                </div>
                <div className="relative w-full sm:w-auto">
                                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 sm:w-[18px] sm:h-[18px]" size={16} />
                  <input
                    type="text"
                    placeholder={`Search ${selectedTab === 'faculty' ? 'faculty' : 'staff'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto pl-8 sm:pl-10 pr-4 py-2 bg-white/60 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredFaculty.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleFacultyClick(member.erpid)}
                  className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-red-100 last:border-b-0 ${
                    selectedFaculty === member.erpid
                      ? 'bg-gradient-to-r from-red-100 to-white shadow-md scale-105'
                      : 'hover:bg-red-50'
                  }`}
                  style={{ background: selectedFaculty === member.erpid ? 'linear-gradient(90deg, #fff0f0 0%, #fff 100%)' : undefined }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-700 to-red-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-red-900 text-sm sm:text-base truncate">{member.name}</h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-700 mt-1">
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="text-xs text-red-500 mt-1">
                        ERP ID: {member.erpid}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Overlay for Analytics and Records */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-2 sm:p-4"
            onClick={handleCloseModal}
          >
            <div
              className="relative w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh] animate-fadeIn"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button (fixed) */}
              <button
                onClick={handleCloseModal}
                className="fixed top-4 sm:top-8 right-4 sm:right-8 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-100 rounded-full p-2 transition-colors z-50"
                aria-label="Close"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {profileLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-slate-800">Loading Stress Data...</h3>
                  </div>
                </div>
              ) : (selectedFaculty && stressData.length > 0) ? (
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                  {/* Animated Header */}
                  <div className="relative bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
                    <div className="relative p-4 sm:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                        <div className="flex items-center space-x-3 sm:space-x-6">
                          <div className="relative">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 sm:p-4 rounded-2xl shadow-lg">
                              <User className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          </div>
                          <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              {facultyName}
                            </h1>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-gray-600 text-sm sm:text-base">ERP ID:</span>
                              <span className="font-mono bg-gradient-to-r from-blue-100 to-indigo-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold text-blue-800 border border-blue-200">
                                {erpId}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-3 sm:p-4 text-white shadow-lg">
                            <p className="text-xs sm:text-sm opacity-90">Total Records</p>
                            <p className="text-2xl sm:text-3xl font-bold">{filteredData.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Statistics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-xs sm:text-sm font-medium">Stressed Sessions</p>
                          <p className="text-2xl sm:text-3xl font-bold text-red-800">{stats.stressed}</p>
                          <p className="text-xs sm:text-sm text-red-700 font-medium">{stats.stressPercentage}% of total</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-800 to-red-900 p-2 sm:p-3 rounded-xl">
                          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Sessions</p>
                          <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.active}</p>
                          <p className="text-xs sm:text-sm text-red-500 font-medium">{stats.activePercentage}% of total</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-700 to-red-800 p-2 sm:p-3 rounded-xl">
                          <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-xs sm:text-sm font-medium">Wellness Score</p>
                          <p className="text-2xl sm:text-3xl font-bold text-red-900">
                            {stats.total > 0 ? Math.max(0, 100 - stats.stressPercentage) : 0}
                          </p>
                          <p className="text-xs sm:text-sm text-red-700 font-medium">Out of 100</p>
                        </div>
                        <div className="bg-gradient-to-r from-red-900 to-red-800 p-2 sm:p-3 rounded-xl">
                          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Date Selection */}
                  <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4 min-w-fit">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 sm:p-3 rounded-xl">
                          <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <label className="text-lg sm:text-xl font-bold text-gray-900">
                          Select Date Range:
                        </label>
                      </div>
                      {/* Compact Stress Level Indicators - inline */}
                      <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 shadow-sm text-center max-w-full sm:max-w-xl sm:ml-auto">
                        <div className="font-semibold text-gray-700 mb-1">Stress Level Indicators:</div>
                        <div className="text-xs sm:text-sm">
                          <span className="text-red-700 font-semibold">STRESS:</span> <strong> L1 - 70-80 % | L2 - 80-90 % | L3 - 90-100 %</strong>
                        </div>
                        <div className="text-xs sm:text-sm">
                          <span className="text-green-700 font-semibold">UNSTRESS:</span> <strong>A1 - 90-100 % | A2 - 80-90 % | A3 - 70-80 %</strong>
                        </div>  
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="from-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          From Date:
                        </label>
                        <input
                          id="from-date"
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full px-3 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm sm:text-lg font-medium bg-gradient-to-r from-white to-gray-50"
                        />
                      </div>
                      <div>
                        <label htmlFor="to-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          To Date:
                        </label>
                        <input
                          id="to-date"
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          min={fromDate}
                          className="w-full px-3 sm:px-6 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm sm:text-lg font-medium bg-gradient-to-r from-white to-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Charts Section */}
                  {filteredData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-900 to-red-800 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          <h2 className="text-lg sm:text-2xl font-bold text-white">Stress Level Distribution</h2>
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="h-64 sm:h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="level" 
                                tick={{ fontSize: 12, fontWeight: 'bold' }}
                                className="sm:text-sm"
                                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12, fontWeight: 'bold' }}
                                className="sm:text-sm"
                                axisLine={{ stroke: '#d1d5db', strokeWidth: 2 }}
                              />
                              <Tooltip 
                                formatter={(value, name) => [value, 'Count']}
                                labelFormatter={(label) => `Level: ${label}`}
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '12px',
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                  fontSize: '12px'
                                }}
                              />
                              <Bar 
                                dataKey="count" 
                                radius={[8, 8, 0, 0]}
                                className="hover:opacity-80 transition-opacity"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </ReBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4 sm:mt-6">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-red-800 to-red-900 rounded-full shadow-lg"></div>
                            <span className="text-sm sm:text-lg font-semibold text-red-900">Stressed Levels (L1, L2, L3)</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg"></div>
                            <span className="text-sm sm:text-lg font-semibold text-green-700">Unstress Levels (A1, A2, A3)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Data Records */}
                  <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-700 p-4 sm:p-6">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        <h2 className="text-lg sm:text-2xl font-bold text-white">
                          Records from {new Date(fromDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} to {new Date(toDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h2>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      {filteredData.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                          <div className="bg-gradient-to-r from-gray-400 to-gray-500 p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                            <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                          </div>
                          <p className="text-gray-600 text-lg sm:text-xl font-semibold mb-2">No records found for the selected date range</p>
                          <p className="text-gray-400 text-base sm:text-lg">Try selecting a different date range to view data</p>
                        </div>
                      ) : (
                        <>
                          {/* Mobile Card View */}
                          <div className="block sm:hidden space-y-3">
                            {filteredData.map((record, index) => {
                              const statusBadge = getStatusBadge(record.stress_status);
                              const levelBadge = getLevelBadge(record.stress_level);
                              const StatusIcon = statusBadge.icon;
                              
                              return (
                                <div 
                                  key={record.id} 
                                  className="group relative bg-gradient-to-r from-white to-gray-50 p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-xl transition-all duration-300"
                                  style={{ animationDelay: `${index * 100}ms` }}
                                >
                                  <div className="space-y-3">
                                    {/* Date */}
                                    <div className="flex items-center font-mono text-sm text-gray-700">
                                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                      {record.timestamp.toISOString().split('T')[0]}
                                    </div>
                                    {/* Time */}
                                    <div className="flex items-center space-x-2">
                                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-lg">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <span className="font-mono text-base font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                        {formatTime(record.timestamp)}
                                      </span>
                                    </div>
                                    {/* Status and Level */}
                                    <div className="flex items-center justify-between">
                                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${statusBadge.className} transition-all duration-200`}>
                                        <StatusIcon className="h-3 w-3" />
                                        <span className="font-bold text-xs">{record.stress_status}</span>
                                      </div>
                                      <div className={`flex items-center justify-center px-3 py-2 rounded-xl font-bold text-xs ${levelBadge.className} ${levelBadge.pulse ? 'animate-pulse' : ''}`}> 
                                        {record.stress_level}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Hover effect indicator */}
                                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop Table View */}
                          <div className="hidden sm:block">
                            {/* Sub-header row for columns */}
                            <div className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-100 rounded-lg font-semibold text-gray-700 text-base">
                              <div className="w-1/4">Date</div>
                              <div className="w-1/4">Time</div>
                              <div className="w-1/4">Status</div>
                              <div className="w-1/4">Level</div>
                            </div>
                            <div className="space-y-4">
                              {filteredData.map((record, index) => {
                                const statusBadge = getStatusBadge(record.stress_status);
                                const levelBadge = getLevelBadge(record.stress_level);
                                const StatusIcon = statusBadge.icon;
                                
                                return (
                                  <div 
                                    key={record.id} 
                                    className="group relative bg-gradient-to-r from-white to-gray-50 p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                  >
                                    <div className="flex items-center justify-between">
                                      {/* Date */}
                                      <div className="w-1/4 flex items-center font-mono text-base text-gray-700">
                                        {record.timestamp.toISOString().split('T')[0]}
                                      </div>
                                      {/* Time */}
                                      <div className="w-1/4 flex items-center space-x-3">
                                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-lg">
                                          <Clock className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="font-mono text-lg font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                          {formatTime(record.timestamp)}
                                        </span>
                                      </div>
                                      {/* Status */}
                                      <div className={`w-1/4 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl ${statusBadge.className} transition-all duration-200`}>
                                        <StatusIcon className="h-4 w-4" />
                                        <span className="font-bold text-sm">{record.stress_status}</span>
                                      </div>
                                      {/* Level */}
                                      <div className={`w-1/4 flex items-center justify-center px-3 py-2 rounded-xl font-bold text-sm ${levelBadge.className} ${levelBadge.pulse ? 'animate-pulse' : ''}`}> 
                                        {record.stress_level}
                                      </div>
                                    </div>
                                    {/* Hover effect indicator */}
                                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedFaculty ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                         <BarChart3 className="text-slate-400 sm:w-8 sm:h-8" size={24} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">No Stress Data</h3>
                  <p className="text-slate-600 text-sm sm:text-base">No stress records found for this faculty member.</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminStressDisplay;
