import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Activity, 
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ClassroomDistribution = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  // Fetch faculty logs
  const fetchFacultyLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hod/faculty-log', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch faculty logs');
      }
      
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching faculty logs:', err);
      setError('Failed to load faculty logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyLogs();
  }, []);

  // Filtered logs based on date range
  const filteredLogs = useMemo(() => {
    if (!dateRange.start && !dateRange.end) {
      return logs;
    }
    
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      let matchesDate = true;
      
      if (dateRange.start) {
        matchesDate = matchesDate && logDate >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        matchesDate = matchesDate && logDate < endDate;
      }
      
      return matchesDate;
    });
  }, [logs, dateRange]);

  // Process data for pie chart
  const chartData = useMemo(() => {
    const classroomCounts = filteredLogs.reduce((acc, log) => {
      acc[log.classroom] = (acc[log.classroom] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(classroomCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by usage count descending
  }, [filteredLogs]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];

  // Calculate total usage time for each classroom
  const classroomUsageTime = useMemo(() => {
    const usageByClassroom = filteredLogs.reduce((acc, log) => {
      if (!acc[log.classroom]) {
        acc[log.classroom] = {
          count: 0,
          totalTime: 0,
          faculty: new Set()
        };
      }
      acc[log.classroom].count++;
      acc[log.classroom].faculty.add(log.person_name);
      return acc;
    }, {});

    // Calculate total time (assuming each log represents 30 minutes of activity)
    Object.keys(usageByClassroom).forEach(classroom => {
      usageByClassroom[classroom].totalTime = usageByClassroom[classroom].count * 30; // 30 minutes per log
    });

    return usageByClassroom;
  }, [filteredLogs]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    
    const headers = ['Classroom', 'Usage Count', 'Total Time (minutes)', 'Unique Faculty', 'Last Activity'];
    
    const rows = Object.entries(classroomUsageTime).map(([classroom, data]) => [
      classroom,
      data.count,
      data.totalTime,
      data.faculty.size,
      new Date(Math.max(...filteredLogs.filter(log => log.classroom === classroom).map(log => new Date(log.timestamp)))).toLocaleString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classroom_distribution.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Modal content for classroom details
  const renderModalContent = () => {
    if (!selectedClassroom) return null;

    const classroomLogs = filteredLogs.filter(log => log.classroom === selectedClassroom);
    const facultyByClassroom = classroomLogs.reduce((acc, log) => {
      if (!acc[log.person_name]) {
        acc[log.person_name] = {
          count: 0,
          lastActivity: new Date(log.timestamp)
        };
      }
      acc[log.person_name].count++;
      acc[log.person_name].lastActivity = new Date(Math.max(acc[log.person_name].lastActivity, new Date(log.timestamp)));
      return acc;
    }, {});

    return (
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <button 
          className="mb-4 text-blue-600 hover:underline" 
          onClick={() => setSelectedClassroom(null)}
        >
          &larr; Back to all classrooms
        </button>
        <h2 className="text-xl font-bold mb-4">{selectedClassroom} - Detailed Usage</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Activity</h3>
            <p className="text-2xl font-bold text-blue-600">{classroomUsageTime[selectedClassroom]?.count || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Total Time</h3>
            <p className="text-2xl font-bold text-green-600">
              {Math.floor((classroomUsageTime[selectedClassroom]?.totalTime || 0) / 60)}h {(classroomUsageTime[selectedClassroom]?.totalTime || 0) % 60}m
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-3">Faculty Activity in {selectedClassroom}</h3>
        <table className="min-w-full text-left border mb-2">
          <thead>
            <tr>
              <th className="border px-4 py-2">Faculty Name</th>
              <th className="border px-4 py-2">Activity Count</th>
              <th className="border px-4 py-2">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(facultyByClassroom).map(([faculty, data], idx) => (
              <tr key={faculty} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="border px-4 py-2">{faculty}</td>
                <td className="border px-4 py-2">{data.count}</td>
                <td className="border px-4 py-2">{data.lastActivity.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 rounded-xl text-center">
        <RefreshCw className="mx-auto mb-4 text-blue-500 animate-spin" size={48} />
        <p className="text-gray-600 text-xl font-medium">Loading classroom distribution...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-100 p-12 rounded-xl text-center">
        <Activity className="mx-auto mb-4 text-red-500" size={48} />
        <p className="text-red-600 text-xl font-medium">Error loading data</p>
        <p className="text-red-500 mt-2">{error}</p>
        <button 
          onClick={fetchFacultyLogs}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 rounded-xl text-center">
        <Activity className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-600 text-xl font-medium">No faculty logs available</p>
        <p className="text-gray-500 mt-2">Check back later for classroom activity data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Classroom Distribution</h1>
            <p className="text-gray-600 mt-1">View class-wise faculty activity distribution</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchFacultyLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg text-sm"
            value={dateRange.start}
            onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
            max={dateRange.end || undefined}
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg text-sm"
            value={dateRange.end}
            onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
            min={dateRange.start || undefined}
          />
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classrooms</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(classroomUsageTime).length}</p>
            </div>
            <MapPin className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activity</p>
              <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
            </div>
            <Activity className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Faculty</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredLogs.map(log => log.person_name)).size}
              </p>
            </div>
            <Clock className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor((filteredLogs.length * 30) / 60)}h {(filteredLogs.length * 30) % 60}m
              </p>
            </div>
            <Calendar className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Classroom Usage Distribution</h3>
          <Activity className="text-gray-400" size={20} />
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={150}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                onClick={(_, index) => {
                  const entry = chartData[index];
                  if (entry && entry.name) {
                    setSelectedClassroom(entry.name);
                    setModalOpen(true);
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [
                  `${value} activities (${Math.floor((value * 30) / 60)}h ${(value * 30) % 60}m)`,
                  'Usage'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No classroom data available for the selected date range
          </div>
        )}
      </div>

      {/* Classroom Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Classroom Usage Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classroom
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage Count
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Faculty
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(classroomUsageTime)
                .sort(([,a], [,b]) => b.count - a.count)
                .map(([classroom, data]) => (
                <tr key={classroom} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="text-gray-400 mr-2" size={16} />
                      <span className="text-sm font-medium text-gray-900">{classroom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{data.count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {Math.floor(data.totalTime / 60)}h {data.totalTime % 60}m
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{data.faculty.size}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {new Date(Math.max(...filteredLogs.filter(log => log.classroom === classroom).map(log => new Date(log.timestamp)))).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedClassroom(classroom);
                        setModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Classroom Details</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedClassroom(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDistribution; 