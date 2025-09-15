import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiFileText, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import HeaderMobile from '../common/HeaderMobile';

const formats = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
];

const reportTypes = [
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'stress', label: 'Stress Report' },
  { value: 'leave', label: 'Leave Report' },  
];

const userTypes = [
  { value: 'faculty', label: 'Faculty' },
  { value: 'nonteaching', label: 'Non-Teaching Staff' },
];

const HODFacultyReport = () => {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [format, setFormat] = useState('pdf');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const facultyDropdownOpen = useRef(false);
  const facultyDropdownRef = useRef(null);
  const [reportType, setReportType] = useState('attendance');
  const [rangeType, setRangeType] = useState('daily');
  const [userType, setUserType] = useState('faculty');
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('all');

  useEffect(() => {
    // Fetch faculty for dropdown
    const fetchFaculty = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://82.112.238.4:9000/api/hod/faculty', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFaculty(response.data || []);
      } catch (err) {
        setFaculty([]);
      }
    };
    fetchFaculty();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        facultyDropdownOpen.current = false;
      }
    }
    if (facultyDropdownOpen.current) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [facultyDropdownOpen.current]);

  useEffect(() => {
    // Set default date range based on rangeType
    const today = new Date();
    if (rangeType === 'daily') {
      const d = today.toISOString().split('T')[0];
      setFromDate(d);
      setToDate(d);
    } else if (rangeType === 'weekly') {
      const day = today.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setFromDate(monday.toISOString().split('T')[0]);
      setToDate(sunday.toISOString().split('T')[0]);
    } else if (rangeType === 'monthly') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(first.toISOString().split('T')[0]);
      setToDate(last.toISOString().split('T')[0]);
    }
  }, [rangeType]);

  useEffect(() => {
    // Fetch faculty or staff for dropdown based on userType
    const fetchList = async () => {
      try {
        const token = localStorage.getItem('token');
        if (userType === 'faculty') {
          const response = await axios.get('http://82.112.238.4:9000/api/hod/faculty', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFaculty(response.data || []);
        } else {
          const response = await axios.get('http://82.112.238.4:9000/api/hod/nonteaching', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStaff(response.data || []);
        }
      } catch (err) {
        setFaculty([]);
        setStaff([]);
      }
    };
    fetchList();
  }, [userType]);

  useEffect(() => {
    // Reset selected on userType change
    setSelectedFaculty('all');
    setSelectedStaff('all');
  }, [userType]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let params = {
        fromDate: fromDate,
        toDate: toDate,
        format,
      };
      let endpoint;
      if (userType === 'faculty') {
        params.faculty = selectedFaculty;
        if (reportType === 'attendance') {
          endpoint = 'http://82.112.238.4:9000/api/hod/faculty-attendance-report';
          params.from = fromDate;
          params.to = toDate;
        } else if (reportType === 'stress') {
          endpoint = 'http://82.112.238.4:9000/api/hod/faculty-stress-report';
          params.from = fromDate;
          params.to = toDate;
        } else if (reportType === 'leave') {
          endpoint = 'http://82.112.238.4:9000/api/hod/faculty-leave-report';
        }
      } else {
        params.staff = selectedStaff;
        if (reportType === 'attendance') {
          endpoint = 'http://82.112.238.4:9000/api/hod/nonteaching-attendance-report';
          params.from = fromDate;
          params.to = toDate;
        } else if (reportType === 'stress') {
          endpoint = 'http://82.112.238.4:9000/api/hod/nonteaching-stress-report';
          params.from = fromDate;
          params.to = toDate;
        } else if (reportType === 'leave') {
          setError('Leave report is only available for faculty.');
          setDownloading(false);
          return;
        }
      }
      const response = await axios.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      // Get filename from content-disposition or fallback
      const disposition = response.headers['content-disposition'];
      let filename = 'report.' + format;
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <HeaderMobile title="Report" />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-10 my-4 sm:my-8 border border-gray-200 transition-all duration-300 hover:shadow-xl w-full pt-16">
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 flex items-center text-gray-800">
              <FiFileText className="mr-3 sm:mr-4 text-red-800 text-3xl sm:text-4xl" />
              <span className="bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
                Generate Faculty {reportType === 'attendance' ? 'Attendance' : reportType === 'stress' ? 'Stress' : 'Leave'} Report
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
              {reportTypes.map(rt => (
                <button
                  key={rt.value}
                  className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-base sm:text-lg font-semibold border-2 transition-all duration-200 ${
                    reportType === rt.value
                      ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                      : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                  }`}
                  onClick={() => setReportType(rt.value)}
                >
                  {rt.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {userTypes.map(type => (
                <button
                  key={type.value}
                  className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${
                    userType === type.value
                      ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                      : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                  }`}
                  onClick={() => setUserType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['daily', 'weekly', 'monthly'].map(type => (
                <button
                  key={type}
                  className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${
                    rangeType === type
                      ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                      : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                  }`}
                  onClick={() => setRangeType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-10">
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-3">
                  {userType === 'faculty' ? 'Faculty' : 'Non-Teaching Staff'}
                </label>
                <div className="relative" ref={facultyDropdownRef}>
                  <select
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-lg bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                    value={userType === 'faculty' ? selectedFaculty : selectedStaff}
                    onChange={e => userType === 'faculty' ? setSelectedFaculty(e.target.value) : setSelectedStaff(e.target.value)}
                  >
                    <option value="all">All {userType === 'faculty' ? 'Faculty' : 'Non-Teaching Staff'}</option>
                    {(userType === 'faculty' ? faculty : staff).map(f => (
                      <option key={f.erpid} value={f.erpid}>{f.name} ({f.erpid})</option>
                    ))}
                  </select>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">
                  Select a {userType === 'faculty' ? 'faculty' : 'staff'} or choose 'All {userType === 'faculty' ? 'Faculty' : 'Non-Teaching Staff'}' for the department.
                </p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-3">Format</label>
                <select
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                >
                  {formats.map(f => (
                    <option key={f.value} value={f.value} className="text-base sm:text-lg">{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-3">From Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-4 top-3 sm:top-4 text-red-700 text-xl sm:text-2xl" />
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 rounded-xl pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 text-base sm:text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-3">To Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-4 top-3 sm:top-4 text-red-700 text-xl sm:text-2xl" />
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 rounded-xl pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 text-base sm:text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {error && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-red-100 border-l-4 border-red-800 text-red-700 text-base sm:text-lg rounded-lg animate-pulse">
                {error}
              </div>
            )}
            <button
              className={`w-full mt-2 sm:mt-4 flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 rounded-xl text-lg sm:text-xl font-bold bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg transition-all duration-200 hover:from-red-800 hover:to-red-950 focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 ${downloading ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
            >
              <FiDownload className="mr-2 text-2xl animate-bounce" />
              {downloading ? 'Generating Report...' : 'Download Report'}
              {downloading && (
                <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HODFacultyReport; 