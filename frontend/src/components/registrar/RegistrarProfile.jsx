import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { AiOutlineLogout } from 'react-icons/ai';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import HeaderMobile from '../common/HeaderMobile';

const RegistrarProfile = () => {
  const navigate = useNavigate();
  const { logout } = useUser();
  const [registrar, setRegistrar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    try {
      logout();
      localStorage.clear();
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const fetchRegistrarProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get('http://69.62.83.14:9000/api/registrar/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.data) {
          throw new Error('No data received from server');
        }
        setRegistrar(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Error fetching profile data');
        setLoading(false);
      }
    };
    fetchRegistrarProfile();
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-700 animate-pulse">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!registrar) {
    return <div className="p-4 text-gray-700">No profile data available</div>;
  }

  return (
    <>
      <HeaderMobile title="Profile" />
      <div className="pt-16">
        <div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="flex flex-col items-center mb-6">
            <FaUserCircle className="text-[80px] text-red-700 mb-2" />
            <h1 className="text-3xl font-extrabold text-red-800">Profile</h1>
            <p className="text-gray-500">Welcome back, {registrar.name || 'Registrar'}!</p>
          </div>
          <div className="space-y-4 px-2">
            <ProfileField label="Name" value={registrar.name} />
            <ProfileField label="Registrar ID" value={registrar.erpStaffId} />
            <ProfileField label="Email" value={registrar.email} />
            {/* <ProfileField label="Start Date" value={registrar.startDate} />
            <ProfileField label="End Date" value={registrar.endDate || 'Current'} /> */}
            <ProfileField label="Status" value={registrar.isActive ? 'Active' : 'Inactive'} />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/registrar/registrar-settings/edit-profile')}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate('/registrar/registrar-settings/change-password')}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
            >
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-100 text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-red-200 border border-red-300 transition-colors duration-200 flex items-center justify-center mt-2 sm:mt-0"
            >
              <AiOutlineLogout className="mr-2" /> Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Reusable field component
const ProfileField = ({ label, value }) => (
  <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg shadow-sm hover:shadow-md transition">
    <span className="font-medium text-red-900">{label}:</span>
    <span className="text-gray-900 font-semibold">{value || 'N/A'}</span>
  </div>
);

export default RegistrarProfile; 