import React, { useEffect, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get('http://82.112.238.4:9000/api/admin/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAdmin(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error fetching profile');
        setLoading(false);
      }
    };
    fetchAdminProfile();
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-700 animate-pulse">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!admin) {
    return <div className="p-4 text-gray-700">No profile data available</div>;
  }

  return (
    <div className="pt-16">
      <div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-red-100">
        <div className="flex flex-col items-center mb-6">
          <FaUserCircle className="text-[80px] text-red-700 mb-2" />
          <h1 className="text-3xl font-extrabold text-red-800">Admin Profile</h1>
          <p className="text-gray-500">Welcome, {admin.adminname || 'Admin'}!</p>
        </div>
        <div className="space-y-4 px-2">
          <ProfileField label="Admin Name" value={admin.adminname} />
          <ProfileField label="Full Name" value={admin.name} />
          <ProfileField label="Email" value={admin.email} />
          <ProfileField label="Admin ID" value={admin.id} />
          {admin.updated_at && (
            <ProfileField label="Last Updated" value={new Date(admin.updated_at).toLocaleString()} />
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value }) => (
  <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg shadow-sm hover:shadow-md transition">
    <span className="font-medium text-red-900">{label}:</span>
    <span className="text-gray-900 font-semibold">{value || 'N/A'}</span>
  </div>
);

export default AdminProfile; 