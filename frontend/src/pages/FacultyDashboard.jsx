import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import SessionStart from '../components/faculty/SessionStart.jsx';
import { 
  FiUsers, 
  FiUserCheck,
  FiActivity,
  FiBook,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiTarget,
  FiChevronRight,
  FiHome,
  FiAlertTriangle,
  FiClock,
  FiPieChart,
  FiMapPin,
  FiX,
  FiBell,
  FiPlay,
  FiCheckCircle,
  FiXCircle,
  FiUpload
} from 'react-icons/fi';
import axios from 'axios';
import FacultyLogForFaculty from '../components/faculty/FacultyLogForFaculty';

const getInitials = (name) => {
  if (!name) return '';
  const names = name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase();
};

// Helper to get yesterday's date in yyyy-mm-dd format
const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const FacultyDashboard = () => {
  const [profile, setProfile] = useState({ name: '', erpStaffId: '', logs: [] });
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // "YYYY-MM-DD"
  });
  const [tasks, setTasks] = useState([]);
  const [dismissingTaskId, setDismissingTaskId] = useState(null);
  const [dismissError, setDismissError] = useState(null);
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [responseFile, setResponseFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [taskView, setTaskView] = useState('assigned'); // 'assigned' or 'history'
  const [currentSession, setCurrentSession] = useState(null);

  const navigate = useNavigate();

  // Blue color theme variants (similar to red theme in HOD)
  const theme = {
    primary: 'bg-[#b22b2f]',
    secondary: 'bg-[#a22528]',
    lighter: 'bg-[#fdf2f2]',
    accent: 'bg-[#fee2e2]',
    text: 'text-[#b22b2f]',
    border: 'border-[#b22b2f]'
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
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)"
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://69.62.83.14:9000/api/faculty/dashboard', {
          params: { date: selectedDate },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfile({
          name: response.data.name,
          erpStaffId: response.data.erpStaffId,
          logs: response.data.logs || []
        });
      } catch (err) {
        setProfile({ name: 'Unknown', erpStaffId: 'Unknown', logs: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedDate]);

  // Fetch assigned tasks on mount and after actions
  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://69.62.83.14:9000/api/faculty/assigned-tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTasks(response.data.tasks || []);
    } catch (err) {
      setTasks([]);
    }
  };
  useEffect(() => { fetchTasks(); }, []);

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://69.62.83.14:9000/api/faculty/students-data', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setStudents(response.data || []);
      } catch (err) {
        console.error("Error fetching students:", err);
        setStudents([]);
      }
    };

    fetchStudents();
  }, []);

  // Fetch task history
  const fetchTaskHistory = async () => {
    try {
      const response = await axios.get('http://69.62.83.14:9000/api/faculty/task-history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTaskHistory(response.data.tasks || []);
    } catch (err) {
      console.error('Error fetching task history:', err);
      setTaskHistory([]);
    }
  };

  // Accept a task
  const handleAcceptTask = async (id) => {
    setSubmittingTaskId(id);
    try {
      await axios.patch(`http://69.62.83.14:9000/api/faculty/assigned-tasks/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchTasks();
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // Reject a task
  const handleRejectTask = async (id) => {
    setSubmittingTaskId(id);
    try {
      await axios.patch(`http://69.62.83.14:9000/api/faculty/assigned-tasks/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchTasks();
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // Complete a task
  const handleCompleteTask = async (id) => {
    setSubmittingTaskId(id);
    setCompleteError("");
    let responseFileUrl = "";
    try {
      setUploading(true);
      if (responseFile) {
        // Upload file to Cloudinary or your storage
        const formData = new FormData();
        formData.append("file", responseFile);
        formData.append("upload_preset", "your_upload_preset"); // <-- replace
        const uploadRes = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/auto/upload", formData);
        responseFileUrl = uploadRes.data.secure_url;
      }
      setUploading(false);
      await axios.patch(`http://69.62.83.14:9000/api/faculty/assigned-tasks/${id}/complete`, {
        responseFileUrl,
        submissionMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissionMessage("");
      setResponseFile(null);
      await fetchTasks();
    } catch (err) {
      setCompleteError("Failed to complete the task. Try again.");
    } finally {
      setSubmittingTaskId(null);
      setUploading(false);
    }
  };

  // Dismiss a task (if you still want this feature)
  const handleDismissTask = async (assignedTaskId) => {
    setDismissingTaskId(assignedTaskId);
    setDismissError(null);
    try {
      await axios.patch(`http://69.62.83.14:9000/api/faculty/assigned-tasks/${assignedTaskId}/dismiss`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTasks(prev => prev.filter(task => task.assigned_task_id !== assignedTaskId));
    } catch (err) {
      setDismissError('Failed to dismiss the notice. Please try again.');
    } finally {
      setDismissingTaskId(null);
    }
  };

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    accepted: tasks.filter(t => t.status === 'accepted').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    rejected: tasks.filter(t => t.status === 'rejected').length
  };

  const todayLogs = profile.logs.filter(log => {
    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    return logDate === selectedDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center"
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
            className="h-16 w-16 rounded-full border-4 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent"
          ></motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border ${theme.border}`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg border-4 border-blue-200">
              <span className="text-2xl font-bold text-white">{getInitials(profile.name)}</span>
            </div>
            <div>
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-2xl font-bold text-gray-900"
              >
                Welcome  dear, <span className={theme.text}>{profile.name || 'Faculty'}!</span>
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 space-y-1"
              >
                <p className="font-medium text-sm sm:text-base">ERP ID: {profile.erpStaffId || 'Not Available'}</p>
                <p className="text-xs sm:text-sm opacity-90">Empowering your daily teaching journey</p>
              </motion.div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 lg:mt-0 w-full lg:w-auto"
          >
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              {['overview', 'tasks', 'activity', 'session', 'news'].map((tab) => (
                <motion.button
                  key={tab}
                  className={`px-2 sm:px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-xs sm:text-sm ${
                    activeTab === tab ? theme.primary + ' text-white' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.05 }}
                >
                  {tab === 'session' ? 'Start Session' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'tasks' && taskStats.total > 0 && (
                    <span className="ml-1 inline-block bg-white text-[#b22b2f] text-xs rounded-full px-2 py-0.5">
                      {taskStats.total}
                    </span>
                  )}
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
        {/* Session Start Section */}
        {activeTab === 'session' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SessionStart 
              isOpen={activeTab === 'session'} 
              onClose={() => setActiveTab('overview')}
            />
          </motion.div>
        )}

        {/* Overview Section */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {[
                { 
                  title: 'Total Tasks', 
                  value: taskStats.total, 
                  icon: <FiBook className="text-white sm:w-6 sm:h-6" size={20} />, 
                  trend: 'neutral',
                  onClick: () => setActiveTab('tasks')
                },
                { 
                  title: 'Pending Tasks', 
                  value: taskStats.pending, 
                  icon: <FiClock className="text-white sm:w-6 sm:h-6" size={20} />, 
                  trend: taskStats.pending > 0 ? 'down' : 'neutral',
                  color: taskStats.pending > 0 ? 'bg-gradient-to-r from-orange-500 to-red-600' : theme.primary
                },
                { 
                  title: 'Students',
                  value: students.length,
                  icon: <FiUsers className="text-white sm:w-6 sm:h-6" size={20} />,
                  trend: 'neutral',
                  color: theme.primary,
                  onClick: () => navigate('students') // Change this from setActiveTab to navigate
                },
                { 
                  title: 'Completed Tasks',
                  value: taskStats.completed,
                  icon: <FiCheckCircle className="text-white sm:w-6 sm:h-6" size={20} />,
                  trend: 'up',
                  color: theme.primary
                },
                {
                  title: "Today's Activities",
                  value: todayLogs.length,
                  icon: <FiActivity className="text-white sm:w-6 sm:h-6" size={20} />,
                  trend: 'neutral',
                  onClick: () => setActiveTab('activity')
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  variants={itemVariants}
                  whileHover="hover"
                  className={`${stat.color || theme.primary} text-white rounded-xl p-2 sm:p-3 shadow-lg ${stat.onClick ? 'cursor-pointer' : ''}`} // Reduced padding
                  onClick={stat.onClick}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center mb-2"> {/* Reduced icon size and margin */}
                      {stat.icon}
                    </div>
                    {stat.trend === 'up' && <FiTrendingUp className="text-white opacity-60" />}
                    {stat.trend === 'down' && <FiTrendingDown className="text-white opacity-60" />}
                  </div>
                  <h3 className="text-base sm:text-xl font-bold mb-0.5">{stat.value}</h3> {/* Reduced text size and margin */}
                  <p className="text-xs opacity-90">{stat.title}</p> {/* Reduced text size */}
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Tasks */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200 h-[300px] overflow-y-auto"
              >
                <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center ${theme.text} sticky top-0 bg-white py-2`}>
                  <FiBell className={`mr-2 ${theme.text}`} /> Recent Tasks
                </h3>
                {tasks.slice(0, 3).length === 0 ? (
                  <div className="text-gray-500 text-sm">No recent tasks.</div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map(task => (
                      <div key={task.assigned_task_id} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r">
                        <div className="font-medium text-sm">{task.heading || 'Task'}</div>
                        <div className="text-xs text-gray-600 mt-1">{task.message}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tasks.length > 3 && (
                  <button 
                    className={`mt-3 text-sm ${theme.text} hover:text-[#a22528] font-medium sticky bottom-0 bg-white py-2 w-full text-left`}
                    onClick={() => setActiveTab('tasks')}
                  >
                    View all tasks →
                  </button>
                )}
              </motion.div>

              {/* Today's Activity Summary */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200 h-[300px] overflow-y-auto"
              >
                <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center ${theme.text} sticky top-0 bg-white py-2`}>
                  <FiActivity className={`mr-2 ${theme.text}`} /> Today's Activity
                </h3>
                {todayLogs.length === 0 ? (
                  <div className="text-gray-500 text-sm">No activity recorded for today.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{todayLogs.length}</div>
                        <div className="text-xs text-gray-600">Total Logs</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {todayLogs.length > 0 ? 
                            Math.round((todayLogs.length / 8) + 100) + '%' : '0%'}
                        </div>
                        <div className="text-xs text-gray-600">Attendance</div>
                      </div>
                    </div>
                    {todayLogs.slice(0, 2).map(log => (
                      <div key={log.id} className="text-xs text-gray-600 border-l-2 border-blue-300 pl-2">
                        <div className="font-medium">{log.classroom || 'Unknown Location'}</div>
                        <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button 
                  className={`mt-3 text-sm ${theme.text} hover:text-[#a22528] font-medium`}
                  onClick={() => setActiveTab('activity')}
                >
                  View detailed activity →
                </button>
              </motion.div>
            </div>
          </>
        )}

        {/* Tasks Section */}
        {activeTab === 'tasks' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center">
                  <FiBook className={`mr-2 ${theme.text}`} />
                  {taskView === 'assigned' ? 'Assigned Tasks' : 'Task History'} ({taskView === 'assigned' ? tasks.length : taskHistory.length})
                </h2>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskView('assigned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      taskView === 'assigned'
                        ? 'bg-[#b22b2f] text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Assigned Tasks
                  </button>
                  <button
                    onClick={() => {
                      setTaskView('history');
                      fetchTaskHistory();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      taskView === 'history'
                        ? 'bg-[#b22b2f] text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Task History
                  </button>
                </div>
              </div>

              {/* Task List */}
              {taskView === 'assigned' ? (
                // Existing assigned tasks code
                <div className="space-y-4">
                  {tasks.map(task => (
                    <motion.div
                      key={task.assigned_task_id}
                      variants={itemVariants}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group"
                    >
                      {/* Task Header */}
                      <div className="flex justify-between items-start mb-3">
                        {task.heading && (
                          <div className="font-bold text-lg text-blue-900 flex-1 pr-8">{task.heading}</div>
                        )}
                        <button
                          onClick={() => handleDismissTask(task.assigned_task_id)}
                          className="text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none opacity-70 group-hover:opacity-100 disabled:opacity-40 absolute top-4 right-4"
                          disabled={dismissingTaskId === task.assigned_task_id}
                          title="Dismiss"
                        >
                          <FiX />
                        </button>
                      </div>

                      {/* Task Content */}
                      <div className="font-semibold text-gray-800 mb-3 pr-8">{task.message}</div>
                      
                      {task.file_url && (
                        <a
                          href={task.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 underline text-sm flex items-center mb-3"
                        >
                          <FiBook className="mr-1" size={14} />
                          View Attachment
                        </a>
                      )}

                      <div className="text-xs text-gray-500 mb-3 flex items-center">
                        <FiUsers className="mr-1" size={12} />
                        Assigned by: {task.hod_name || 'HOD'} | {new Date(task.created_at).toLocaleString()}
                      </div>

                      {/* Task Actions */}
                      {task.status === 'pending' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAcceptTask(task.assigned_task_id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center"
                            disabled={submittingTaskId === task.assigned_task_id}
                          >
                            <FiCheckCircle className="mr-1" size={14} />
                            {submittingTaskId === task.assigned_task_id ? 'Processing...' : 'Accept'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRejectTask(task.assigned_task_id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center"
                            disabled={submittingTaskId === task.assigned_task_id}
                          >
                            <FiXCircle className="mr-1" size={14} />
                            {submittingTaskId === task.assigned_task_id ? 'Processing...' : 'Reject'}
                          </motion.button>
                        </div>
                      )}

                      {task.status === 'accepted' && (
                        <form
                          className="mt-4 space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
                          onSubmit={e => {
                            e.preventDefault();
                            handleCompleteTask(task.assigned_task_id);
                          }}
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Submission Message (Optional)
                            </label>
                            <textarea
                              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Add any notes or comments about your submission..."
                              value={submissionMessage}
                              onChange={e => setSubmissionMessage(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Upload File (Optional)
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                onChange={e => setResponseFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center"
                            disabled={submittingTaskId === task.assigned_task_id || uploading}
                          >
                            <FiUpload className="mr-2" size={14} />
                            {uploading ? 'Uploading...' : submittingTaskId === task.assigned_task_id ? 'Submitting...' : 'Submit Task'}
                          </motion.button>
                          {completeError && (
                            <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
                              {completeError}
                            </div>
                          )}
                        </form>
                      )}

                      {task.status === 'completed' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-green-700 text-sm font-semibold flex items-center">
                            <FiCheckCircle className="mr-2" size={14} />
                            Task Completed
                          </div>
                          {task.submission_message && (
                            <div className="text-gray-700 mt-2 text-sm">
                              <strong>Message:</strong> {task.submission_message}
                            </div>
                          )}
                          {task.response_file_url && (
                            <a
                              href={task.response_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 underline text-sm flex items-center mt-2 hover:text-blue-700"
                            >
                              <FiBook className="mr-1" size={12} />
                              View Submission File
                            </a>
                          )}
                        </div>
                      )}

                      {task.status === 'rejected' && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-red-600 text-sm font-semibold flex items-center">
                            <FiXCircle className="mr-2" size={14} />
                            Task Rejected
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                // New Task History View
                <div className="space-y-4">
                  {taskHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiBook className="text-gray-400 text-2xl" />
                      </div>
                      <p className="text-gray-500">No task history available.</p>
                    </div>
                  ) : (
                    taskHistory.map(task => (
                      <motion.div
                        key={task.task_id}
                        variants={itemVariants}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{task.heading}</h3>
                            <p className="text-gray-600 mt-1">{task.message}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1" size={14} />
                            Created: {task.created_at_formatted}
                          </div>
                          {task.completed_at_formatted && (
                            <div className="flex items-center">
                              <FiCheckCircle className="mr-1" size={14} />
                              Completed: {task.completed_at_formatted}
                            </div>
                          )}
                          <div className="flex items-center">
                            <FiUsers className="mr-1" size={14} />
                            By: {task.hod_name}
                          </div>
                        </div>

                        {task.submission_message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                            <strong>Submission Note:</strong> {task.submission_message}
                          </div>
                        )}

                        {task.response_file_url && (
                          <a
                            href={task.response_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <FiBook className="mr-1" size={14} />
                            View Submission
                          </a>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Students Section */}
        {activeTab === 'students' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 
                  className="text-lg sm:text-xl font-bold flex items-center cursor-pointer hover:text-blue-700"
                  onClick={() => navigate('/students')}
                >
                  <FiUsers className={`mr-2 ${theme.text}`} />
                  Students ({students.length})
                </h2>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FiUsers className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500">No students found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map(student => (
                    <motion.div
                      key={student.id}
                      variants={itemVariants}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/students/${student.id}`)} // Add navigation to individual student
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FiUser className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{student.name}</h3>
                            <div className="text-sm text-gray-500">
                              Roll No: {student.roll_no} | Year: {student.year} | Division: {student.division}
                            </div>
                            <div className="text-sm text-gray-500">
                              ERP ID: {student.erpid}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{student.email}</div>
                          {student.contact_no && (
                            <div className="text-sm text-gray-500">{student.contact_no}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Activity Section */}
        {activeTab === 'activity' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
            >
              <FacultyLogForFaculty
                logs={profile.logs}
                facultyName={profile.name}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </motion.div>
          </motion.div>
        )}

        {/* News Section */}
        {activeTab === 'news' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center">
                  <FiBell className={`mr-2 ${theme.text}`} />
                  News & Announcements
                </h2>
              </div>
              
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBell className="text-blue-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No News Available</h3>
                <p className="text-gray-600">Check back later for the latest news and announcements.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FacultyDashboard;