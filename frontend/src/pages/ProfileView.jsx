import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBook,
  FiActivity,
  FiBarChart2,
  FiAward,
  FiClock
} from 'react-icons/fi';

const ProfileView = ({ data, type, loading }) => {
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex items-center justify-center"
      >
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-48"></div>
        </div>
      </motion.div>
    );
  }

  // Format date from backend
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full"
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-red-50 to-white p-6 border-b border-gray-100">
        <div className="flex items-start">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-4">
            <FiUser size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>
            <p className="text-gray-600">{data.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                {type === 'students' ? 'Student' : type === 'faculty' ? 'Faculty' : 'Staff'}
              </span>
              {data.department && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {data.department}
                </span>
              )}
              {data.erpStaffId && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  ERP ID: {data.erpStaffId}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DetailCard 
            icon={<FiMail />}
            title="Contact"
            items={[
              { label: 'Email', value: data.email },
              { label: 'Phone', value: data.phone || data.contact_no || 'Not provided' }
            ]}
          />
          <DetailCard 
            icon={<FiCalendar />}
            title={type === 'students' ? 'Academic' : 'Professional'}
            items={[
              { label: 'Joined', value: formatDate(data.startDate || data.joinedDate) },
              { label: type === 'students' ? 'Year' : 'Experience', 
                value: type === 'students' ? 
                  (data.year || 'N/A') : 
                  (data.experience || 'N/A') }
            ]}
          />
        </div>

        {/* Faculty Specific */}
        {type === 'faculty' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatBadge 
                icon={<FiActivity />}
                label="Stress Level"
                value={data.stressLevel || 'Normal'}
                color="bg-red-100 text-red-800"
              />
              <StatBadge 
                icon={<FiBarChart2 />}
                label="Attendance"
                value={`${data.attendance?.percentage || 0}%`}
                color="bg-green-100 text-green-800"
              />
              <StatBadge 
                icon={<FiAward />}
                label="Performance"
                value={data.performance || 'N/A'}
                color="bg-blue-100 text-blue-800"
              />
            </div>

            {data.attendance?.recent && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <FiClock className="mr-2 text-red-600" />
                  Recent Attendance
                </h3>
                <div className="space-y-2">
                  {data.attendance.recent.map((record, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{record.date}</p>
                        <p className="text-sm text-gray-600">{record.classroom}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === 'Present' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Student Specific */}
        {type === 'students' && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <FiBook className="mr-2 text-blue-600" />
              Academic Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <h4 className="font-medium">Division</h4>
                <p className="text-sm text-gray-600">{data.division || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <h4 className="font-medium">Roll Number</h4>
                <p className="text-sm text-gray-600">{data.roll_no || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DetailCard = ({ icon, title, items }) => (
  <motion.div 
    whileHover={{ y: -3 }}
    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
  >
    <div className="flex items-center mb-3">
      <div className="w-8 h-8 rounded-md bg-red-100 text-red-600 flex items-center justify-center mr-2">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-gray-600">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const StatBadge = ({ icon, label, value, color }) => (
  <motion.div 
    whileHover={{ scale: 1.03 }}
    className={`${color} rounded-lg p-3 flex items-center`}
  >
    <div className="w-10 h-10 rounded-full bg-white bg-opacity-50 flex items-center justify-center mr-3">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  </motion.div>
);

export default ProfileView;