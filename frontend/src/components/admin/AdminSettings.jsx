import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaKey } from 'react-icons/fa';
import HeaderMobile from '../common/HeaderMobile';

const AdminSettings = () => {
  const navigate = useNavigate();
  return (
    <>
      <HeaderMobile title="Settings" />
      <div className="max-w-md mx-auto py-10 px-4 flex flex-col gap-6 pt-16">
        <button
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white text-lg font-semibold shadow hover:from-red-700 hover:to-red-900 transition"
          onClick={() => navigate('/admin/admin-settings/edit-profile')}
        >
          <FaUserEdit className="text-2xl" />
          Edit Profile
        </button>
        <button
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 text-white text-lg font-semibold shadow hover:from-gray-700 hover:to-gray-900 transition"
          onClick={() => navigate('/admin/admin-settings/change-password')}
        >
          <FaKey className="text-2xl" />
          Change Password
        </button>
      </div>
    </>
  );
};

export default AdminSettings;
