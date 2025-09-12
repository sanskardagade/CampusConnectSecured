import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { useIsMobile } from '../hooks/use-mobile';

const HeaderAdmin = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  if (!isMobile) return null;
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-red-900 text-white flex items-center justify-between px-4 py-3 shadow-md">
      <button
        className="text-2xl font-bold bg-gradient-to-r from-red-300 to-red-600 bg-clip-text text-transparent outline-none"
        onClick={() => navigate('/admin')}
      >
        CampusConnect
      </button>
      <button
        className="text-3xl ml-auto"
        onClick={() => navigate('/admin/admin-profile')}
        aria-label="Profile"
      >
        <FaUserCircle />
      </button>
    </header>
  );
};

export default HeaderAdmin; 