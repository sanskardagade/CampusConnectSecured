import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEnvelope, FaPhone, FaBirthdayCake, FaVenusMars, FaIdCard } from 'react-icons/fa';

const StudentProfileEdit = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get('http://82.112.238.4:9000/api/students/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data || !response.data.data) throw new Error('No student data found');

        const profileData = response.data.data;
        // Format date for input
        if (profileData.dob) {
          profileData.dob = new Date(profileData.dob).toISOString().split('T')[0];
        }

        setStudent(profileData);
        setFormData(profileData); // Initialize form data
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred while fetching the profile');
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.put('http://82.112.238.4:9000/api/students/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate('/student/student-profile'); // Redirect after successful update
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while updating the profile');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (!student) return <div className="flex justify-center items-center h-screen">No profile data available.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200">
          <div className="px-6 py-4 bg-gradient-to-r from-[#b22b2f] to-[#9a252a]">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <FaUserCircle className="mr-3 text-[#d1a550]" />
              Edit Profile
            </h1>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField icon={FaIdCard} label="ERP ID" name="erpid" value={formData.erpid} readOnly />
              <EditableField icon={FaUserCircle} label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder={student.name ? `Current: ${student.name}` : 'Enter full name'} />
              <EditableField icon={FaEnvelope} label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder={student.email ? `Current: ${student.email}` : 'Enter email address'} />
              <EditableField icon={FaPhone} label="Contact Number" name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder={student.contactNo ? `Current: ${student.contactNo}` : 'Enter contact number'} />
              <EditableField icon={FaBirthdayCake} label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} placeholder={student.dob ? `Current: ${new Date(student.dob).toLocaleDateString()}` : 'Select date of birth'} />
              <GenderField icon={FaVenusMars} label="Gender" name="gender" value={formData.gender} onChange={handleChange} currentValue={student.gender} />
            </div>
            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => navigate('/student/student-profile')} className="px-6 py-2 mr-4 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 text-white bg-[#b22b2f] rounded-lg hover:bg-[#9a252a] transition-colors">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditableField = ({ icon: Icon, label, name, value, onChange, type = 'text', readOnly = false, placeholder }) => (
  <div className="flex flex-col">
    <label className="flex items-center text-sm font-semibold text-gray-600 mb-2">
      <Icon className="mr-2 text-[#b22b2f]" />
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder || (readOnly ? '' : `Enter ${label.toLowerCase()}`)}
      className={`p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d1a550] focus:border-transparent transition-shadow text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
    />
  </div>
);

const GenderField = ({ icon: Icon, label, name, value, onChange, currentValue }) => (
  <div className="flex flex-col">
    <label className="flex items-center text-sm font-semibold text-gray-600 mb-2">
      <Icon className="mr-2 text-[#b22b2f]" />
      {label}
    </label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d1a550] focus:border-transparent transition-shadow bg-white"
    >
      <option value="" disabled>{currentValue ? `Current: ${currentValue}` : 'Select gender'}</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
    </select>
  </div>
);

export default StudentProfileEdit;
