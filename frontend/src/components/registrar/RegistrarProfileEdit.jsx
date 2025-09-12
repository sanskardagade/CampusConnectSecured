import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaSave, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const RegistrarProfileEdit = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://69.62.83.14:9000/api/registrar/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile({
        name: data.name || '',
        email: data.email || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://69.62.83.14:9000/api/registrar/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/registrar/registrar-profile');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#b22b2f] w-full max-w-2xl rounded-xl shadow-md p-8 text-white"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-600 px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/registrar/registrar-profile')}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                >
                  <FaArrowLeft className="text-xl" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold mb-6 text-center text-[#d1a550]">Edit Profile</h1>
                  <p className="text-red-100">Update your personal information</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 p-4 bg-[#b22b2f] border border-[#d1a550] rounded-lg text-white">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-[#d1a550] border border-[#b22b2f] rounded-lg text-[#b22b2f]">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#d1a550] mb-2">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-red-600" />
                    <span>Full Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[#d1a550] rounded-lg bg-white text-[#b22b2f] focus:ring-2 focus:ring-[#d1a550] focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <FaEnvelope className="text-red-600" />
                    <span>Email Address</span>
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/registrar/registrar-profile')}
                  className="flex-1 bg-[#6b6d71] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#b22b2f] hover:text-[#d1a550] transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#d1a550] text-[#b22b2f] px-6 py-3 rounded-lg font-medium hover:bg-[#b22b2f] hover:text-[#d1a550] disabled:bg-[#d1a550] transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Information Note */}
            <div className="mt-8 p-4 bg-[#f3f4f6] border border-[#d1a550] rounded-lg text-[#b22b2f]">
              <h3 className="font-medium text-[#d1a550] mb-2">Important Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your ERP ID cannot be changed</li>
                <li>• Email address will be used for important notifications</li>
                <li>• Changes will be reflected immediately</li>
                <li>• Contact the administrator if you need to change your ERP ID</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrarProfileEdit; 