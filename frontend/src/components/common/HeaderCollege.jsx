import React from 'react';
import CollegeName from '../../assets/dypdpu_name.png';

const HeaderCollege = () => {
  return (
    <header className="w-full bg-white shadow-sm py-2 px-4 flex items-center justify-center">
      <img
        src={CollegeName}
        alt="DYPDPU"
        className="w-164 h-24 object-contain"
      />
    </header>
  );
};

export default HeaderCollege; 