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

const FacultyLogDisplay = ({ logs = [] }) => {
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 rounded-xl text-center">
        <Activity className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-600 text-xl font-medium">No faculty logs for today</p>
        <p className="text-gray-500 mt-2">Check back later for updates</p>
      </div>
    );
  }

  // Data processing for charts
  const chartData = useMemo(() => {
    const classroomCounts = logs.reduce((acc, log) => {
      acc[log.classroom] = (acc[log.classroom] || 0) + 1;
      return acc;
    }, {});

    const hourlyData = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      const hourKey = `${hour}:00`;
      acc[hourKey] = (acc[hourKey] || 0) + 1;
      return acc;
    }, {});

    return {
      classroomData: Object.entries(classroomCounts).map(([name, value]) => ({ name, value })),
      hourlyData: Object.entries(hourlyData).map(([hour, count]) => ({ hour, count }))
    };
  }, [logs]);

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
    // Group logs by classroom
    const logsByClassroom = logs.reduce((acc, log) => {
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
            <button className="mb-4 text-blue-600 hover:underline" onClick={() => setSelectedClassroom(null)}>&larr; Back to all classrooms</button>
            <h2 className="text-xl font-bold mb-4">{selectedClassroom} - All Activity Instances</h2>
            <table className="min-w-full text-left border mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Faculty</th>
                  <th className="border px-2 py-1">ERP ID</th>
                  <th className="border px-2 py-1">Camera IP</th>
                  <th className="border px-2 py-1">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((log, i) => (
                  <tr key={log.id || i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border px-2 py-1">{log.person_name}</td>
                    <td className="border px-2 py-1">{log.erp_id}</td>
                    <td className="border px-2 py-1">{log.camera_ip}</td>
                    <td className="border px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Show list/table of classrooms
      return (
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold mb-4">All Classrooms</h2>
          <table className="min-w-full text-left border mb-2">
            <thead>
              <tr>
                <th className="border px-4 py-2">Classroom</th>
                <th className="border px-4 py-2">Activity Count</th>
                <th className="border px-4 py-2">Show Entries</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(logsByClassroom).map(([classroom, entries], idx) => (
                <tr key={classroom} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="border px-4 py-2">{classroom}</td>
                  <td className="border px-4 py-2">{entries.length}</td>
                  <td className="border px-4 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => setSelectedClassroom(classroom)}>
                      View Entries
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (modalType === 'distribution') {
      if (selectedClassroom) {
        const entries = logsByClassroom[selectedClassroom] || [];
        const total = logs.length;
        const percent = total ? ((entries.length / total) * 100).toFixed(2) : 0;
        return (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <button className="mb-4 text-blue-600 hover:underline" onClick={() => setSelectedClassroom(null)}>&larr; Back to all classrooms</button>
            <h2 className="text-xl font-bold mb-4">{selectedClassroom} - Activity Distribution ({percent}%)</h2>
            <table className="min-w-full text-left border mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Faculty</th>
                  <th className="border px-2 py-1">ERP ID</th>
                  <th className="border px-2 py-1">Camera IP</th>
                  <th className="border px-2 py-1">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((log, i) => (
                  <tr key={log.id || i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border px-2 py-1">{log.person_name}</td>
                    <td className="border px-2 py-1">{log.erp_id}</td>
                    <td className="border px-2 py-1">{log.camera_ip}</td>
                    <td className="border px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Show list/table of classrooms
      const total = logs.length;
      return (
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold mb-4">All Classrooms</h2>
          <table className="min-w-full text-left border mb-2">
            <thead>
              <tr>
                <th className="border px-4 py-2">Classroom</th>
                <th className="border px-4 py-2">Distribution (%)</th>
                <th className="border px-4 py-2">Show Entries</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(logsByClassroom).map(([classroom, entries], idx) => {
                const percent = total ? ((entries.length / total) * 100).toFixed(2) : 0;
                return (
                  <tr key={classroom} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border px-4 py-2">{classroom}</td>
                    <td className="border px-4 py-2">{percent}%</td>
                    <td className="border px-4 py-2">
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

  // Filtered logs for table
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
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
  }, [logs, filterFaculty, filterClassroom, dateRange]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Faculty Activity Dashboard</h1>
                <p className="text-gray-600">Real-time monitoring and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" onClick={() => window.location.reload()}>
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                onClick={handleExportCSV}
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLogs}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="text-gray-600 ml-1">from last hour</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Locations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.uniqueClassrooms}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <MapPin className="text-green-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-600">Classrooms monitored</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Faculty</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeFaculty}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <User className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-600">Currently tracked</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Cameras</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCameras}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Camera className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Eye className="text-blue-500 mr-1" size={16} />
              <span className="text-gray-600">Online and recording</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Activity Chart */}
          <div
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Location Activity</h3>
              <MapPin className="text-gray-400" size={20} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
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
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Activity Distribution</h3>
              <Activity className="text-gray-400" size={20} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.classroomData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
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
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="flex flex-wrap items-center gap-3">
                {/* Faculty Filter */}
                <select
                  className="px-3 py-2 border rounded text-sm"
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
                  className="px-3 py-2 border rounded text-sm"
                  value={filterClassroom}
                  onChange={e => setFilterClassroom(e.target.value)}
                >
                  <option value="">All Classrooms</option>
                  {classroomOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                {/* Date Range */}
                <input
                  type="date"
                  className="px-3 py-2 border rounded text-sm"
                  value={dateRange.start}
                  onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                  max={dateRange.end || undefined}
                  placeholder="Start date"
                />
                <span className="mx-1 text-gray-400">to</span>
                <input
                  type="date"
                  className="px-3 py-2 border rounded text-sm"
                  value={dateRange.end}
                  onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                  min={dateRange.start || undefined}
                  placeholder="End date"
                />
                {/* Reset Filters */}
                <button
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camera IP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">{log.classroom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Camera className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-600 font-mono">{log.camera_ip}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No activity found for selected filters.</td>
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