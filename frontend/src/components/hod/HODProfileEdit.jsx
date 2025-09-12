import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, X, User, Mail, Phone, Calendar, Award, Building, MapPin, Book, Clock, ArrowLeft } from 'lucide-react';

const HODProfileEdit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.get('http://69.62.83.14:9000/api/hod/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        department: response.data.department || '',
      });
      setLoading(false);
    } catch (error) {
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { name, email } = formData;
    if (!name || !email) {
      setError('Name and email are required');
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.put(
        'http://69.62.83.14:9000/api/hod/profile',
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        navigate('/hod/hod-profile');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/hod/hod-profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-white flex items-center justify-center p-6">
        <div className="bg-[#b22b2f] w-full max-w-2xl rounded-xl shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#b22b2f] rounded w-1/3 mx-auto mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-[#b22b2f] rounded"></div>
              <div className="h-10 bg-[#b22b2f] rounded"></div>
              <div className="h-10 bg-[#b22b2f] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-white flex items-center justify-center p-6">
      <div className="bg-[#b22b2f] w-full max-w-2xl rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#d1a550]">Edit HOD Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField 
            label="Full Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange}
            required
          />
          <InputField 
            label="Email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange}
            required
          />
          <InputField 
            label="Department" 
            name="department" 
            value={formData.department} 
            disabled
          />
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-[#6b6d71] text-white px-4 py-2 rounded hover:bg-[#b22b2f] transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#d1a550] text-[#b22b2f] font-semibold px-6 py-2 rounded hover:bg-[#b22b2f] hover:text-[#d1a550] transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {error && <p className="text-sm text-[#b22b2f] mt-4">{error}</p>}
          {message && <p className="text-sm text-[#d1a550] mt-4">{message}</p>}
        </form>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, type = 'text', required = false, disabled = false }) => (
  <div>
    <label className="block text-sm mb-1 text-[#d1a550]">
      {label}
      {required && <span className="text-[#b22b2f] ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      required={required}
      disabled={disabled}
      className="w-full px-4 py-2 rounded bg-white text-[#b22b2f] border border-[#d1a550] focus:outline-none focus:ring-2 focus:ring-[#d1a550] disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

export default HODProfileEdit;