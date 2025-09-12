import React from 'react';

const CollegeSelectModal = ({ open, onClose, onSelect, colleges }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-[#6b6d71] hover:text-[#6b6d71]"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        <h2 className="text-center text-2xl mb-5">Select College</h2>
        <div className="flex flex-col gap-3">
          {colleges.map((college) => (
            college === "Dr. D. Y. Patil Inst. of Tech., Pimpri" ? (
              <button
                key={college}
                className="bg-[#b22b2f] text-white p-3 rounded-md hover:bg-[#d1a550] transition-colors"
                onClick={() => onSelect(college)}
              >
                {college}
              </button>
            ) : (
              <button
                key={college}
                className="bg-gray-300 text-gray-600 p-3 rounded-md cursor-not-allowed flex justify-between items-center"
                disabled
              >
                <span>{college}</span>
                <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollegeSelectModal; 