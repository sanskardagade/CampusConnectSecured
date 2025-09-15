import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import axios from 'axios';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    erpid: '',
    name: '',
    email: '',
    department_id: '',
    password: ''
  });

  // Fetch faculty and departments on component mount
  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/registrar/faculty', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setFaculty(response.data.faculty || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      alert('Error fetching faculty data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/registrar/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      erpid: '',
      name: '',
      email: '',
      department_id: '',
      password: ''
    });
    setEditingFaculty(null);
  };

  const openModal = (facultyMember = null) => {
    if (facultyMember) {
      setEditingFaculty(facultyMember);
      setFormData({
        erpid: facultyMember.erpid,
        name: facultyMember.name,
        email: facultyMember.email,
        department_id: facultyMember.department_id,
        password: '' // Don't populate password for editing
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.erpid || !formData.name || !formData.email || !formData.department_id) {
      alert('Please fill in all required fields');
      return;
    }

    // Password is required only for new faculty members
    if (!editingFaculty && !formData.password) {
      alert('Password is required for new faculty members');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const url = editingFaculty 
        ? `http://localhost:5000/api/registrar/faculty/${editingFaculty.id}`
        : 'http://localhost:5000/api/registrar/faculty';
      
      const method = editingFaculty ? 'PUT' : 'POST';
      
      // Prepare data - only include password for new faculty
      const submitData = {
        erpid: formData.erpid,
        name: formData.name,
        email: formData.email,
        department_id: parseInt(formData.department_id) // Convert to number
      };
      
      if (!editingFaculty && formData.password) {
        submitData.password = formData.password;
      }
      
      console.log('Submitting faculty data:', submitData);
      
      const response = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: submitData
      });

      const data = response.data;

      if (response.status === 200 || response.status === 201) {
        alert(data.message);
        closeModal();
        fetchFaculty();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving faculty:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Error saving faculty member');
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/registrar/faculty/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data;

      if (response.status === 200) {
        alert(data.message);
        fetchFaculty();
      } else {
        alert(data.message || 'Failed to delete faculty member');
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      alert('Error deleting faculty member');
    }
  };

  // Filter faculty based on search and department
  const filteredFaculty = faculty.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.erpid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || member.department_id == departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b22b2f]"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#b22b2f] mb-1 sm:mb-2">Faculty Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage faculty members and their information</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 w-full">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
                />
              </div>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Add Button */}
            <button
              onClick={() => openModal()}
              className="bg-[#b22b2f] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-[#a02529] transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <FaPlus /> Add Faculty
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Total Faculty</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#b22b2f]">{faculty.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Filtered Results</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{filteredFaculty.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Departments</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{departments.length}</p>
          </div>
        </div>

        {/* Faculty List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-4 sm:mt-6">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            {filteredFaculty.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
                {searchTerm || departmentFilter ? 'No faculty members found matching your criteria' : 'No faculty members found'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredFaculty.map((member) => (
                  <div key={member.id} className="p-3 sm:p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{member.name}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">{member.email}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => openModal(member)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        ERP: {member.erpid}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {member.department_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#b22b2f] text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">ERP ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Department</th>
                  <th className="px-6 py-3 text-center text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || departmentFilter ? 'No faculty members found matching your criteria' : 'No faculty members found'}
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-sm">{member.erpid}</td>
                      <td className="px-6 py-4 text-sm">{member.name}</td>
                      <td className="px-6 py-4 text-sm">{member.email}</td>
                      <td className="px-6 py-4 text-sm">{member.department_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(member)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#b22b2f] mb-3 sm:mb-4">
                {editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ERP ID *
                  </label>
                  <input
                    type="text"
                    name="erpid"
                    value={formData.erpid}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {!editingFaculty && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b22b2f] focus:border-transparent text-sm sm:text-base"
                      required={!editingFaculty}
                      placeholder="Enter password for new faculty member"
                    />
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 sm:px-4 py-2 bg-[#b22b2f] text-white rounded-lg hover:bg-[#a02529] transition-colors text-sm sm:text-base"
                  >
                    {editingFaculty ? 'Update' : 'Add'} Faculty
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement; 