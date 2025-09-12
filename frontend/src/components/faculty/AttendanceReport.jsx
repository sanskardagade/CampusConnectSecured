import React from "react";
import { FaRegClock } from "react-icons/fa";

const AttendanceReport = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100">
    <FaRegClock className="text-6xl text-yellow-500 animate-bounce mb-4" />
    <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent mb-2 drop-shadow-lg animate-pulse">
      Coming Soon
    </h1>
    <p className="text-lg text-gray-700 font-medium mt-2 animate-fade-in">
      We are working hard to bring you this feature. Stay tuned!
    </p>
  </div>
);

export default AttendanceReport;
