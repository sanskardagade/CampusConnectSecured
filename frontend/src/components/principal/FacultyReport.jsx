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

const attendanceTypes = [
  { value: 'faculty', label: 'Faculty Attendance' },
  { value: 'staff', label: 'Non-Teaching Staff Attendance' },
];

const stressTypes = [
  { value: 'faculty', label: 'Faculty Stress' },
  { value: 'staff', label: 'Non-Teaching Staff Stress' },
];

const FacultyReport = () => {
  const [departments, setDepartments] = useState([]);
  const [reportDept, setReportDept] = useState(['all']);
  const [format, setFormat] = useState('pdf');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  const [reportType, setReportType] = useState('attendance');
  const [rangeType, setRangeType] = useState('daily');
  const [attendanceType, setAttendanceType] = useState('faculty');
  const [stressType, setStressType] = useState('faculty');
  const [attendanceStatus, setAttendanceStatus] = useState('present'); // present or absent

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/principal/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(response.data.departments || []);
      } catch {
        setDepartments([]);
      }
    };
    fetchDepartments();
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

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      const params = {
        departmentId: reportDept.includes('all') ? 'all' : reportDept.join(','),
        fromDate,
        toDate,
        format,
      };

      let endpoint = '';

      if (reportType === 'attendance') {
        if (attendanceStatus === 'present') {
          endpoint = attendanceType === 'faculty'
            ? 'http://localhost:5000/api/principal/faculty-attendance-report'
            : 'http://localhost:5000/api/principal/staff-attendance-report';
        } else {
          endpoint = attendanceType === 'faculty'
            ? 'http://localhost:5000/api/principal/absent-faculty-today'
            : 'http://localhost:5000/api/principal/absent-staff-today'; // be sure to implement this backend route
        }
      } else if (reportType === 'stress') {
        endpoint = stressType === 'faculty'
          ? 'http://localhost:5000/api/principal/faculty-stress-report'
          : 'http://localhost:5000/api/principal/staff-stress-report';
      } else if (reportType === 'leave') {
        endpoint = 'http://localhost:5000/api/principal/faculty-leave-report';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob',
      });

      let filename = '';

      if (reportType === 'attendance') {
        if (attendanceStatus === 'present') {
          filename = attendanceType === 'faculty'
            ? `faculty_attendance_report.${format}`
            : `staff_attendance_report.${format}`;
        } else {
          filename = attendanceType === 'faculty'
            ? `absent_faculty_report.${format}`
            : `absent_staff_report.${format}`;
        }
      } else if (reportType === 'stress') {
        filename = stressType === 'faculty'
          ? `faculty_stress_report.${format}`
          : `staff_stress_report.${format}`;
      } else if (reportType === 'leave') {
        filename = `faculty_leave_report.${format}`;
      }

      const disposition = response.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
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
                Generate{' '}
                {reportType === 'attendance'
                  ? attendanceStatus === 'present'
                    ? attendanceType === 'faculty'
                      ? 'Faculty Attendance'
                      : 'Non-Teaching Staff Attendance'
                    : attendanceType === 'faculty'
                    ? 'Absent Faculty'
                    : 'Absent Non-Teaching Staff'
                  : reportType === 'stress'
                  ? stressType === 'faculty'
                    ? 'Faculty Stress'
                    : 'Non-Teaching Staff Stress'
                  : 'Faculty Leave'}{' '}
                Report
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

            {reportType === 'attendance' && (
              <>
                {/* Present/Absent Toggle */}
                <div className="flex gap-2 mb-6 justify-center">
                  {['present', 'absent'].map(status => (
                    <button
                      key={status}
                      className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${
                        attendanceStatus === status
                          ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                          : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                      }`}
                      onClick={() => setAttendanceStatus(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Faculty/Staff Toggle */}
                <div className="flex gap-2 mb-6 justify-center">
                  {attendanceTypes.map(at => (
                    <button
                      key={at.value}
                      className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${
                        attendanceType === at.value
                          ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                          : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                      }`}
                      onClick={() => setAttendanceType(at.value)}
                    >
                      {at.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {reportType === 'stress' && (
              <div className="flex gap-2 mb-6 justify-center">
                {stressTypes.map(st => (
                  <button
                    key={st.value}
                    className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all duration-200 ${
                      stressType === st.value
                        ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                        : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                    }`}
                    onClick={() => setStressType(st.value)}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-6 justify-center">
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
                <label className="block text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-3">Department</label>
                <div className="relative" ref={deptDropdownRef}>
                  <button
                    type="button"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-lg bg-white text-left flex justify-between items-center focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                    onClick={() => setDeptDropdownOpen(open => !open)}
                  >
                    <span>
                      {reportDept.includes('all')
                        ? 'All Departments'
                        : reportDept.length === 0
                          ? 'Select Departments'
                          : reportDept.length === 1
                            ? departments.find(d => d.id === reportDept[0])?.name || 'Select Departments'
                            : `${reportDept.length} selected`}
                    </span>
                    <svg className={`w-5 h-5 ml-2 transition-transform ${deptDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {deptDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-h-72 overflow-y-auto">
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-red-600 rounded focus:ring-red-600 border-gray-300"
                          checked={reportDept.includes('all')}
                          onChange={e => {
                            if (e.target.checked) {
                              setReportDept(['all']);
                            } else {
                              setReportDept([]);
                            }
                          }}
                        />
                        <span className="text-base sm:text-lg">All Departments</span>
                      </label>
                      {departments.map(dept => (
                        <label key={dept.id} className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-red-600 rounded focus:ring-red-600 border-gray-300"
                            checked={reportDept.includes(dept.id)}
                            disabled={reportDept.includes('all')}
                            onChange={e => {
                              if (e.target.checked) {
                                setReportDept(prev => prev.filter(v => v !== 'all').concat(dept.id));
                              } else {
                                setReportDept(prev => prev.filter(v => v !== dept.id));
                              }
                            }}
                          />
                          <span className="text-base sm:text-lg">{dept.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Tick to select branches. Selecting 'All Departments' disables others.</p>
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
              disabled={downloading}
              onClick={handleDownload}
              className={`w-full mt-2 sm:mt-4 flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 rounded-xl text-lg sm:text-xl font-bold bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg transition-all duration-200 hover:from-red-800 hover:to-red-950 focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 ${
                downloading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <FiDownload className="mr-2 text-2xl animate-bounce" />
              {downloading ? 'Generating Report...' : 'Download Report'}
              {downloading && (
                <svg
                  className="animate-spin ml-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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

export default FacultyReport;
 