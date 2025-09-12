import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaKey } from 'react-icons/fa';
import { useIsMobile } from '../hooks/use-mobile'

const FacultySettings = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile && (
        <div className="block sm:hidden w-full bg-red-700 text-white text-lg font-bold py-3 px-4 shadow">Settings</div>
      )}
      <div className="max-w-md mx-auto py-10 px-4 flex flex-col gap-6">
        <button
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white text-lg font-semibold shadow hover:from-red-700 hover:to-red-900 transition"
          onClick={() => navigate('/faculty/faculty-settings/edit-profile')}
        >
          <FaUserEdit className="text-2xl" />
          Edit Profile
        </button>
        <button
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 text-white text-lg font-semibold shadow hover:from-gray-700 hover:to-gray-900 transition"
          onClick={() => navigate('/faculty/faculty-settings/change-password')}
        >
          <FaKey className="text-2xl" />
          Change Password
        </button>
      </div>
    </>
  );
};

export default FacultySettings;
