import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Calendar, User } from 'lucide-react';

const Todo = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    account_id: 1, // Default account ID - you may want to get this from authentication
    title: '',
    description: '',
    status: 'pending',
    due_date: '',
    task_timing: ''
  });

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please login to view your tasks.');
        setLoading(false);
        return;
      }
      const response = await fetch('http://69.62.83.14:9000/api/faculty/todo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired or unauthorized. Please login again.');
        } else {
          setError(`Failed to fetch tasks: HTTP error! status: ${response.status}`);
        }
        setTasks([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      console.log('Fetched tasks:', data); // Debug line
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
      setTasks([]);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please login to add or edit tasks.');
        return;
      }
      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask
        ? `http://69.62.83.14:9000/api/faculty/todo/${editingTask.task_id}`
        : 'http://69.62.83.14:9000/api/faculty/todo';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired or unauthorized. Please login again.');
        } else if (response.status === 404) {
          setError('API endpoint not found (404).');
        } else {
          setError(`Failed to save task: HTTP error! status: ${response.status}`);
        }
        return;
      }

      await fetchTasks(); // Refresh the task list
      resetForm();
      setError('');
    } catch (err) {
      setError('Failed to save task: ' + err.message);
      console.error('Error saving task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please login to delete tasks.');
        return;
      }
      const response = await fetch(`http://69.62.83.14:9000/api/faculty/todo/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired or unauthorized. Please login again.');
        } else if (response.status === 404) {
          setError('API endpoint not found (404).');
        } else {
          setError(`Failed to delete task: HTTP error! status: ${response.status}`);
        }
        return;
      }

      await fetchTasks();
      setError('');
    } catch (err) {
      setError('Failed to delete task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      account_id: task.account_id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      task_timing: task.task_timing || ''
    });
    setShowForm(true);
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please login to update tasks.');
        return;
      }
      const response = await fetch(`http://69.62.83.14:9000/api/faculty/todo/${task.task_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired or unauthorized. Please login again.');
        } else if (response.status === 404) {
          setError('API endpoint not found (404).');
        } else {
          setError(`Failed to update task status: HTTP error! status: ${response.status}`);
        }
        return;
      }

      await fetchTasks();
    } catch (err) {
      setError('Failed to update task status: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      account_id: 1,
      title: '',
      description: '',
      status: 'pending',
      due_date: '',
      task_time: ''
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Task Manager</h1>
          <p className="text-gray-600">Stay organized and productive</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add New Task
          </button>
        </div>

        {/* Task Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Time
                  </label>
                  <input
                    type="time"
                    value={formData.task_timing}
                    onChange={(e) => setFormData({...formData, task_timing: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add task description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tasks yet</h3>
              <p className="text-gray-500">Create your first task to get started!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.task_id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow duration-200 ${
                  task.status === 'completed' 
                    ? 'border-l-green-500' 
                    : isOverdue(task.due_date, task.status)
                    ? 'border-l-red-500'
                    : 'border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`font-semibold text-lg ${
                    task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'
                  }`}>
                    {task.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className={`p-1 rounded-full transition-colors duration-200 ${
                        task.status === 'completed'
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-blue-600 hover:text-blue-700 p-1 rounded-full transition-colors duration-200"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.task_id)}
                      className="text-red-600 hover:text-red-700 p-1 rounded-full transition-colors duration-200"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Time: {task.task_timing}</span>
                    </div>
                    {task.due_date && (
                      <div className={`flex items-center gap-1 ${
                        isOverdue(task.due_date, task.status) ? 'text-red-600' : ''
                      }`}>
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.status}
                  </span>
                </div>

                {task.created_at && (
                  <div className="mt-2 text-xs text-gray-400">
                    Created: {formatDate(task.created_at)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Todo;