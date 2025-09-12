import React, { useState, useMemo } from 'react';
import { 
  User, 
  MapPin, 
  Clock, 
  Camera, 
  Activity, 
  Calendar,
  TrendingUp,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const FacultyLogDisplay = ({ logs = [], facultyName }) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'location' or 'distribution'
  const [selectedClassroom, setSelectedClassroom] = useState(null); // for class-wise modal view
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Handle null logs
  if (!logs || logs === null) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 sm:p-12 rounded-xl text-center">
        <Activity className="mx-auto mb-4 text-gray-400 sm:w-12 sm:h-12" size={32} />
        <p className="text-gray-600 text-lg sm:text-xl font-medium">No faculty logs for today</p>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">Check back later for updates</p>
      </div>
    );
  }

  // Filtered logs for table
  const filteredLogs = useMemo(() => {
    // First, apply the existing filters
    let logsToFilter = logs.filter(log => {
      const matchesFaculty = filterFaculty ? log.person_name === filterFaculty : true;
      const matchesClassroom = filterClassroom ? log.classroom === filterClassroom : true;
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(log.timestamp) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        // Add 1 day to end date to make it inclusive
        const endDate = new Date(dateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        matchesDate = matchesDate && new Date(log.timestamp) < endDate;
      }
      return matchesFaculty && matchesClassroom && matchesDate;
    });

    // Sort logs by faculty and timestamp (descending)
    logsToFilter = logsToFilter.sort((a, b) => {
      if (a.person_name === b.person_name) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return a.person_name.localeCompare(b.person_name);
    });

    // Filter to only one log per 30-minute window per faculty
    const filteredByWindow = [];
    const lastLogTimeByFaculty = {};
    for (const log of logsToFilter) {
      const faculty = log.person_name;
      const logTime = new Date(log.timestamp).getTime();
      if (!lastLogTimeByFaculty[faculty] || (lastLogTimeByFaculty[faculty] - logTime) >= 30 * 60 * 1000) {
        filteredByWindow.push(log);
        lastLogTimeByFaculty[faculty] = logTime;
      }
    }
    return filteredByWindow;
  }, [logs, filterFaculty, filterClassroom, dateRange]);

  // Data processing for charts
  const chartData = useMemo(() => {
    // Use filtered logs if date range is set, otherwise use all logs
    const logsForChart = (dateRange.start || dateRange.end) ? filteredLogs : logs;
    const classroomCounts = logsForChart.reduce((acc, log) => {
      acc[log.classroom] = (acc[log.classroom] || 0) + 1;
      return acc;
    }, {});

    const hourlyData = logsForChart.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      const hourKey = `${hour}:00`;
      acc[hourKey] = (acc[hourKey] || 0) + 1;
      return acc;
    }, {});

    return {
      classroomData: Object.entries(classroomCounts).map(([name, value]) => ({ name, value })),
      hourlyData: Object.entries(hourlyData).map(([hour, count]) => ({ hour, count }))
    };
  }, [logs, filteredLogs, dateRange]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const stats = {
    totalLogs: logs.length,
    uniqueClassrooms: new Set(logs.map(log => log.classroom)).size,
    activeFaculty: new Set(logs.map(log => log.person_name)).size,
    activeCameras: new Set(logs.map(log => log.camera_ip)).size
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    // Define CSV headers
    const headers = ['Faculty', 'ERP ID', 'Classroom', 'Camera IP', 'Timestamp'];
    // Map logs to CSV rows
    const rows = logs.map(log => [
      log.person_name,
      log.erp_id,
      log.classroom,
      log.camera_ip,
      new Date(log.timestamp).toLocaleString()
    ]);
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_logs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Modal content generator
  const renderModalContent = () => {
    // Use filteredLogs if date range is set, otherwise use all logs
    const logsForModal = (dateRange.start || dateRange.end) ? filteredLogs : logs;
    // Group logs by classroom
    const logsByClassroom = logsForModal.reduce((acc, log) => {
      if (!acc[log.classroom]) acc[log.classroom] = [];
      acc[log.classroom].push(log);
      return acc;
    }, {});

    if (modalType === 'location') {
      if (selectedClassroom) {
        // Show only the selected classroom's entries
        const entries = logsByClassroom[selectedClassroom] || [];
        return (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <button className="mb-4 text-blue-600 hover:underline text-sm sm:text-base" onClick={() => setSelectedClassroom(null)}>&larr; Back to all classrooms</button>
            <h2 className="text-lg sm:text-xl font-bold mb-4">{selectedClassroom} - All Activity Instances</h2>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {entries.map((log, i) => (
                <div key={log.id || i} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center mb-2">
                    <User className="text-blue-600 mr-2" size={16} />
                    <span className="font-medium text-sm">{log.person_name}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ERP ID:</span>
                      <span className="font-mono">{log.erp_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Camera IP:</span>
                      <span className="font-mono">{log.camera_ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <table className="min-w-full text-left border mb-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-sm">Faculty</th>
                    <th className="border px-2 py-1 text-sm">ERP ID</th>
                    <th className="border px-2 py-1 text-sm">Camera IP</th>
                    <th className="border px-2 py-1 text-sm">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((log, i) => (
                    <tr key={log.id || i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border px-2 py-1 text-sm">{log.person_name}</td>
                      <td className="border px-2 py-1 text-sm">{log.erp_id}</td>
                      <td className="border px-2 py-1 text-sm">{log.camera_ip}</td>
                      <td className="border px-2 py-1 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      // Show list/table of classrooms
      return (
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="text-lg sm:text-xl font-bold mb-4">All Classrooms</h2>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {Object.entries(logsByClassroom).map(([classroom, entries], idx) => (
              <div key={classroom} className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{classroom}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{entries.length} activities</span>
                </div>
                <button 
                  className="text-blue-600 hover:underline text-sm w-full text-left"
                  onClick={() => setSelectedClassroom(classroom)}
                >
                  View Entries →
                </button>
              </div>
            ))}
          </div>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="min-w-full text-left border mb-2">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-sm">Classroom</th>
                  <th className="border px-4 py-2 text-sm">Activity Count</th>
                  <th className="border px-4 py-2 text-sm">Show Entries</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(logsByClassroom).map(([classroom, entries], idx) => (
                  <tr key={classroom} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border px-4 py-2 text-sm">{classroom}</td>
                    <td className="border px-4 py-2 text-sm">{entries.length}</td>
                    <td className="border px-4 py-2 text-sm">
                      <button className="text-blue-600 hover:underline" onClick={() => setSelectedClassroom(classroom)}>
                        View Entries
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (modalType === 'distribution') {
      if (selectedClassroom) {
        const entries = logsByClassroom[selectedClassroom] || [];
        const total = logsForModal.length;
        const percent = total ? ((entries.length / total) * 100).toFixed(2) : 0;
        return (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <button className="mb-4 text-blue-600 hover:underline text-sm sm:text-base" onClick={() => setSelectedClassroom(null)}>&larr; Back to all classrooms</button>
            <h2 className="text-lg sm:text-xl font-bold mb-4">{selectedClassroom} - Activity Distribution ({percent}%)</h2>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {entries.map((log, i) => (
                <div key={log.id || i} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center mb-2">
                    <User className="text-blue-600 mr-2" size={16} />
                    <span className="font-medium text-sm">{log.person_name}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ERP ID:</span>
                      <span className="font-mono">{log.erp_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Camera IP:</span>
                      <span className="font-mono">{log.camera_ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <table className="min-w-full text-left border mb-2">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-sm">Faculty</th>
                    <th className="border px-2 py-1 text-sm">ERP ID</th>
                    <th className="border px-2 py-1 text-sm">Camera IP</th>
                    <th className="border px-2 py-1 text-sm">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((log, i) => (
                    <tr key={log.id || i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border px-2 py-1 text-sm">{log.person_name}</td>
                      <td className="border px-2 py-1 text-sm">{log.erp_id}</td>
                      <td className="border px-2 py-1 text-sm">{log.camera_ip}</td>
                      <td className="border px-2 py-1 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      // Show list/table of classrooms
      const total = logsForModal.length;
      return (
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="text-lg sm:text-xl font-bold mb-4">All Classrooms</h2>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {Object.entries(logsByClassroom).map(([classroom, entries], idx) => {
              const percent = total ? ((entries.length / total) * 100).toFixed(2) : 0;
              return (
                <div key={classroom} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{classroom}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{percent}%</span>
                  </div>
                  <button 
                    className="text-blue-600 hover:underline text-sm w-full text-left"
                    onClick={() => setSelectedClassroom(classroom)}
                  >
                    View Entries →
                  </button>
                </div>
              );
            })}
          </div>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="min-w-full text-left border mb-2">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-sm">Classroom</th>
                  <th className="border px-4 py-2 text-sm">Distribution (%)</th>
                  <th className="border px-4 py-2 text-sm">Show Entries</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(logsByClassroom).map(([classroom, entries], idx) => {
                  const percent = total ? ((entries.length / total) * 100).toFixed(2) : 0;
                  return (
                    <tr key={classroom} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border px-4 py-2 text-sm">{classroom}</td>
                      <td className="border px-4 py-2 text-sm">{percent}%</td>
                      <td className="border px-4 py-2 text-sm">
                        <button className="text-blue-600 hover:underline" onClick={() => setSelectedClassroom(classroom)}>
                          View Entries
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return null;
  };

  // Reset selectedClassroom when modal closes or type changes
  React.useEffect(() => {
    if (!modalOpen) setSelectedClassroom(null);
    if (modalType !== 'location' && modalType !== 'distribution') setSelectedClassroom(null);
  }, [modalOpen, modalType]);

  // Unique values for dropdowns
  const facultyOptions = useMemo(() => Array.from(new Set(logs.map(l => l.person_name))).filter(Boolean), [logs]);
  const classroomOptions = useMemo(() => Array.from(new Set(logs.map(l => l.classroom))).filter(Boolean), [logs]);

  // Determine the faculty name to display
  let displayName = facultyName;
  if (!displayName && logs && logs.length > 0) {
    displayName = logs[0].person_name;
  }
  if (!displayName) {
    displayName = 'Faculty';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl sm:text-2xl font-bold"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <Activity className="text-blue-600 sm:w-6 sm:h-6" size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{displayName} </h1>
                <p className="text-gray-600 text-sm sm:text-base">Real-time monitoring and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm" onClick={() => window.location.reload()}>
                <RefreshCw size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                onClick={handleExportCSV}
              >
                <Download size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Activities</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.totalLogs}</p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <Activity className="text-blue-600 sm:w-6 sm:h-6" size={20} />
              </div>
            </div>
            <div className="flex items-center mt-3 sm:mt-4 text-xs sm:text-sm">
              <TrendingUp className="text-green-500 mr-1 sm:w-4 sm:h-4" size={14} />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="text-gray-600 ml-1">from last hour</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Locations</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.uniqueClassrooms}</p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <MapPin className="text-green-600 sm:w-6 sm:h-6" size={20} />
              </div>
            </div>
            <div className="flex items-center mt-3 sm:mt-4 text-xs sm:text-sm">
              <span className="text-gray-600">Classrooms monitored</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Recent Activity</p>
              </div>
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <Clock className="text-purple-600 sm:w-6 sm:h-6" size={20} />
              </div>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Recent:</span>
                <span className="text-gray-900 font-medium">
                  {logs.length > 0 ? `${new Date(logs[0].timestamp).toLocaleDateString()} ${new Date(logs[0].timestamp).toLocaleTimeString()}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Location Activity Chart */}
          <div
            className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Location Activity</h3>
              <MapPin className="text-gray-400 sm:w-5 sm:h-5" size={18} />
            </div>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={chartData.classroomData}
                onClick={state => {
                  if (state && state.activeLabel) {
                    setModalType('location');
                    setSelectedClassroom(state.activeLabel);
                    setModalOpen(true);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="sm:text-xs" />
                <YAxis tick={{ fontSize: 10 }} className="sm:text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}
                  onClick={data => {
                    if (data && data.name) {
                      setModalType('location');
                      setSelectedClassroom(data.name);
                      setModalOpen(true);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div
            className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Activity Distribution</h3>
              <Activity className="text-gray-400 sm:w-5 sm:h-5" size={18} />
            </div>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={chartData.classroomData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  className="sm:w-24 sm:h-24"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  onClick={(_, index) => {
                    const entry = chartData.classroomData[index];
                    if (entry && entry.name) {
                      setModalType('distribution');
                      setSelectedClassroom(entry.name);
                      setModalOpen(true);
                    }
                  }}
                >
                  {chartData.classroomData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                {/* Faculty Filter */}
                <select
                  className="px-2 sm:px-3 py-2 border rounded text-xs sm:text-sm w-full sm:w-auto"
                  value={filterFaculty}
                  onChange={e => setFilterFaculty(e.target.value)}
                >
                  <option value="">All Faculty</option>
                  {facultyOptions.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
                {/* Classroom Filter */}
                <select
                  className="px-2 sm:px-3 py-2 border rounded text-xs sm:text-sm w-full sm:w-auto"
                  value={filterClassroom}
                  onChange={e => setFilterClassroom(e.target.value)}
                >
                  <option value="">All Classrooms</option>
                  {classroomOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                {/* Date Range */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    className="px-2 sm:px-3 py-2 border rounded text-xs sm:text-sm"
                    value={dateRange.start}
                    onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                    max={dateRange.end || undefined}
                    placeholder="Start date"
                  />
                  <span className="mx-1 text-gray-400 text-center sm:text-left">to</span>
                  <input
                    type="date"
                    className="px-2 sm:px-3 py-2 border rounded text-xs sm:text-sm"
                    value={dateRange.end}
                    onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                    min={dateRange.start || undefined}
                    placeholder="End date"
                  />
                </div>
                {/* Reset Filters */}
                <button
                  className="px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-200 w-full sm:w-auto"
                  onClick={() => {
                    setFilterFaculty('');
                    setFilterClassroom('');
                    setDateRange({ start: '', end: '' });
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No activity found for selected filters.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <User className="text-blue-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {log.person_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ERP: {log.erp_id}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center">
                        <MapPin className="text-gray-400 mr-2" size={14} />
                        <span className="text-gray-900 font-medium">{log.classroom}</span>
                      </div>
                      <div className="flex items-center">
                        <Camera className="text-gray-400 mr-2" size={14} />
                        <span className="text-gray-600 font-mono">{log.camera_ip}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="text-gray-400 mr-2" size={14} />
                        <span className="text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty Member
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camera IP
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <User className="text-blue-600" size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.person_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ERP: {log.erp_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">{log.classroom}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Camera className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-600 font-mono">{log.camera_ip}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">No activity found for selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogDisplay;