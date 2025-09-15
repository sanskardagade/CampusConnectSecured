import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { FiPieChart, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const COLORS = ['#EF4444', '#F59E42', '#10B981', '#6366F1', '#FBBF24', '#3B82F6'];

const FacultyAttendanceOverview = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced error logging
  const logError = (error, context) => {
    const errorDetails = {
      context,
      timestamp: new Date().toISOString(),
      errorMessage: error.message,
      errorStack: error.stack,
      responseData: error.response?.data,
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: error.config?.headers ? { ...error.config.headers, authorization: '***' } : null
      }
    };
    
    console.error('Detailed API Error:', errorDetails);
    return errorDetails;
  };

  // Fetch faculty list with better error handling
  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await axios.get('/api/hod/faculty', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
      });
      
      if (!res.data || !Array.isArray(res.data)) {
        throw new Error('Invalid faculty data format received');
      }

      setFacultyList(res.data);
    } catch (error) {
      const errorInfo = logError(error, 'fetchFaculty');
      setError({
        userMessage: 'Failed to load faculty list',
        technicalDetails: errorInfo,
        retry: fetchFaculty
      });
      setFacultyList([]);
    }
  };

  // Enhanced attendance data fetching
  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = {
        faculty: selectedFaculty,
        from: dateRange.from,
        to: dateRange.to
      };

      // Clean up params
      const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value && value !== 'all')
      );

      const res = await axios.get('/api/hod/faculty-attendance-data', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: cleanedParams,
        baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
        timeout: 10000
      });

      // Validate response structure
      if (!res.data || !Array.isArray(res.data)) {
        throw new Error('Invalid attendance data format received');
      }

      setAttendanceData(res.data);
      
      // Extract unique locations safely
      const locs = [...new Set(
        res.data
          .map(d => d?.location || d?.classroom || d?.camera_ip)
          .filter(Boolean)
      )];
      setLocationList(locs);
      
    } catch (error) {
      const errorInfo = logError(error, 'fetchAttendance');
      
      // Create user-friendly error message
      let userMessage = 'Failed to fetch attendance data';
      if (error.response) {
        userMessage = error.response.data?.message || 
                     `Server responded with ${error.response.status}`;
      } else if (error.message.includes('timeout')) {
        userMessage = 'Request timed out - please try again';
      }
      
      setError({
        userMessage,
        technicalDetails: errorInfo,
        retry: fetchAttendance
      });
      setAttendanceData([]);

      // Auto-retry for transient errors
      if (retryCount < 2 && !error.response) {
        setTimeout(() => {
          setRetryCount(c => c + 1);
          fetchAttendance();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    setRetryCount(0); // Reset retry counter when filters change
    if (localStorage.getItem('token')) {
      fetchAttendance();
    }
  }, [selectedFaculty, dateRange]);

  // Data transformation for location distribution (for individual faculty)
  const locationData = React.useMemo(() => {
    try {
      if (selectedFaculty === 'all' || !attendanceData?.length) return [];
      
      const counts = attendanceData.reduce((acc, d) => {
        const location = d.location || 'Unknown Location';
        acc[location] = (acc[location] || 0) + (d.log_count || 1);
        return acc;
      }, {});

      return Object.entries(counts).map(([name, value], i) => ({ 
        name, 
        value,
        color: COLORS[i % COLORS.length]
      }));
    } catch (error) {
      logError(error, 'locationData transformation');
      return [];
    }
  }, [attendanceData, selectedFaculty]);

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Attempt {retryCount + 1} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200 mt-6">
        <div className="flex items-center text-red-600">
          <FiAlertCircle className="mr-2 text-2xl" />
          <h2 className="text-xl font-bold">Error Loading Data</h2>
        </div>
        <p className="mt-3">{error.userMessage}</p>
        
        <div className="mt-4 p-3 bg-red-50 rounded text-sm">
          <details>
            <summary className="cursor-pointer font-medium">Technical Details</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify({
                message: error.technicalDetails.errorMessage,
                status: error.technicalDetails.responseData?.status,
                code: error.technicalDetails.responseData?.code
              }, null, 2)}
            </pre>
          </details>
        </div>
        
        <div className="mt-4 flex gap-3">
          <button 
            onClick={error.retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Retry
          </button>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200 mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-red-800">
        <FiPieChart className="mr-2" /> Faculty Attendance Overview
      </h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Faculty</label>
          <select
            className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={selectedFaculty}
            onChange={e => setSelectedFaculty(e.target.value)}
            disabled={loading}
          >
            <option value="all">All Faculty</option>
            {facultyList.map(f => (
              <option key={f.erpid || f.id} value={f.erpid || f.id}>
                {f.name || `Faculty ${f.erpid || f.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-1">From Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={dateRange.from}
            onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
            max={dateRange.to}
            disabled={loading}
          />
        </div>

        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-1">To Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
            value={dateRange.to}
            onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
            min={dateRange.from}
            disabled={loading}
          />
        </div>
      </div>

      {/* Show table for All Faculty */}
      {selectedFaculty === 'all' && (
        <div className="mt-8">
          <div className="font-semibold mb-4">
            All Faculty Attendance Data
          </div>
          {attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.faculty_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.log_count || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
              No attendance data available
            </div>
          )}
        </div>
      )}

      {/* Show pie chart for individual faculty */}
      {selectedFaculty !== 'all' && (
        <div className="mt-8">
          <div className="font-semibold mb-4 flex items-center">
            <FiPieChart className="mr-1" /> Location Distribution for {facultyList.find(f => f.erpid === selectedFaculty)?.name || 'Selected Faculty'}
          </div>
          {locationData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {locationData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} entries`, 'Count']}
                    labelFormatter={(name) => `Location: ${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
              No location distribution data available for selected faculty
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyAttendanceOverview;


//  import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
// import { FiPieChart, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

// const COLORS = ['#EF4444', '#F59E42', '#10B981', '#6366F1', '#FBBF24', '#3B82F6'];

// const FacultyAttendanceOverview = () => {
//   const [facultyList, setFacultyList] = useState([]);
//   const [locationList, setLocationList] = useState([]);
//   const [selectedFaculty, setSelectedFaculty] = useState('all');
//   const [selectedLocation, setSelectedLocation] = useState('all');
//   const [dateRange, setDateRange] = useState({ from: '', to: '' });
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [retryCount, setRetryCount] = useState(0);

//   // Enhanced error logging
//   const logError = (error, context) => {
//     const errorDetails = {
//       context,
//       timestamp: new Date().toISOString(),
//       errorMessage: error.message,
//       errorStack: error.stack,
//       responseData: error.response?.data,
//       requestConfig: {
//         url: error.config?.url,
//         method: error.config?.method,
//         params: error.config?.params,
//         headers: error.config?.headers ? { ...error.config.headers, authorization: '***' } : null
//       }
//     };
    
//     console.error('Detailed API Error:', errorDetails);
//     return errorDetails;
//   };

//   // Fetch faculty list with better error handling
//   const fetchFaculty = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const res = await axios.get('/api/hod/faculty', {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
//       });
      
//       if (!res.data || !Array.isArray(res.data)) {
//         throw new Error('Invalid faculty data format received');
//       }

//       setFacultyList(res.data);
//     } catch (error) {
//       const errorInfo = logError(error, 'fetchFaculty');
//       setError({
//         userMessage: 'Failed to load faculty list',
//         technicalDetails: errorInfo,
//         retry: fetchFaculty
//       });
//       setFacultyList([]);
//     }
//   };

//   // Enhanced attendance data fetching
//   const fetchAttendance = async () => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const params = {
//         faculty: selectedFaculty,
//         from: dateRange.from,
//         to: dateRange.to,
//         location: selectedLocation
//       };

//       // Clean up params
//       const cleanedParams = Object.fromEntries(
//         Object.entries(params).filter(([_, value]) => value && value !== 'all')
//       );

//       const res = await axios.get('/api/hod/faculty-attendance-data', {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         params: cleanedParams,
//         baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
//         timeout: 10000
//       });

//       // Validate response structure
//       if (!res.data || !Array.isArray(res.data)) {
//         throw new Error('Invalid attendance data format received');
//       }

//       setAttendanceData(res.data);
      
//       // Extract unique locations safely
//       const locs = [...new Set(
//         res.data
//           .map(d => d?.location || d?.classroom || d?.camera_ip)
//           .filter(Boolean)
//       )];
//       setLocationList(locs);
      
//     } catch (error) {
//       const errorInfo = logError(error, 'fetchAttendance');
      
//       // Create user-friendly error message
//       let userMessage = 'Failed to fetch attendance data';
//       if (error.response) {
//         userMessage = error.response.data?.message || 
//                      `Server responded with ${error.response.status}`;
//       } else if (error.message.includes('timeout')) {
//         userMessage = 'Request timed out - please try again';
//       }
      
//       setError({
//         userMessage,
//         technicalDetails: errorInfo,
//         retry: fetchAttendance
//       });
//       setAttendanceData([]);

//       // Auto-retry for transient errors
//       if (retryCount < 2 && !error.response) {
//         setTimeout(() => {
//           setRetryCount(c => c + 1);
//           fetchAttendance();
//         }, 2000);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch data on component mount and when filters change
//   useEffect(() => {
//     fetchFaculty();
//   }, []);

//   useEffect(() => {
//     setRetryCount(0); // Reset retry counter when filters change
//     if (localStorage.getItem('token')) {
//       fetchAttendance();
//     }
//   }, [selectedFaculty, selectedLocation, dateRange]);

//   // Data transformation for location distribution
//   const locationData = React.useMemo(() => {
//     try {
//       if (!attendanceData?.length) return [];
      
//       const counts = attendanceData.reduce((acc, d) => {
//         const location = d.location || 'Unknown Location';
//         acc[location] = (acc[location] || 0) + (d.log_count || 1);
//         return acc;
//       }, {});

//       return Object.entries(counts).map(([name, value], i) => ({ 
//         name, 
//         value,
//         color: COLORS[i % COLORS.length]
//       }));
//     } catch (error) {
//       logError(error, 'locationData transformation');
//       return [];
//     }
//   }, [attendanceData]);

//   // Data transformation for individual faculty (when selected)
//   const facultyAttendanceData = React.useMemo(() => {
//     try {
//       if (selectedFaculty === 'all' || !attendanceData?.length) return [];
      
//       return attendanceData
//         .filter(item => item.erpid === selectedFaculty)
//         .map(item => ({
//           date: item.date,
//           location: item.location,
//           count: item.log_count || 1
//         }));
//     } catch (error) {
//       logError(error, 'facultyAttendanceData transformation');
//       return [];
//     }
//   }, [attendanceData, selectedFaculty]);

//   // Render loading state
//   if (loading) {
//     return (
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mt-6">
//         <div className="flex flex-col items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
//           <p className="text-gray-600">Loading attendance data...</p>
//           {retryCount > 0 && (
//             <p className="text-sm text-gray-500 mt-2">
//               Attempt {retryCount + 1} of 3
//             </p>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Render error state
//   if (error) {
//     return (
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200 mt-6">
//         <div className="flex items-center text-red-600">
//           <FiAlertCircle className="mr-2 text-2xl" />
//           <h2 className="text-xl font-bold">Error Loading Data</h2>
//         </div>
//         <p className="mt-3">{error.userMessage}</p>
        
//         <div className="mt-4 p-3 bg-red-50 rounded text-sm">
//           <details>
//             <summary className="cursor-pointer font-medium">Technical Details</summary>
//             <pre className="mt-2 text-xs overflow-auto">
//               {JSON.stringify({
//                 message: error.technicalDetails.errorMessage,
//                 status: error.technicalDetails.responseData?.status,
//                 code: error.technicalDetails.responseData?.code
//               }, null, 2)}
//             </pre>
//           </details>
//         </div>
        
//         <div className="mt-4 flex gap-3">
//           <button 
//             onClick={error.retry}
//             className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
//           >
//             <FiRefreshCw className="mr-2" />
//             Retry
//           </button>
//           <button 
//             onClick={() => setError(null)}
//             className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
//           >
//             Dismiss
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200 mt-6">
//       <h2 className="text-xl font-bold mb-4 flex items-center text-red-800">
//         <FiPieChart className="mr-2" /> Faculty Attendance Overview
//       </h2>
      
//       {/* Filters */}
//       <div className="flex flex-wrap gap-4 mb-6">
//         <div className="min-w-[200px]">
//           <label className="block text-sm font-medium mb-1">Faculty</label>
//           <select
//             className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
//             value={selectedFaculty}
//             onChange={e => setSelectedFaculty(e.target.value)}
//             disabled={loading}
//           >
//             <option value="all">All Faculty</option>
//             {facultyList.map(f => (
//               <option key={f.erpid || f.id} value={f.erpid || f.id}>
//                 {f.name || `Faculty ${f.erpid || f.id}`}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="min-w-[200px]">
//           <label className="block text-sm font-medium mb-1">From Date</label>
//           <input
//             type="date"
//             className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
//             value={dateRange.from}
//             onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
//             max={dateRange.to}
//             disabled={loading}
//           />
//         </div>

//         <div className="min-w-[200px]">
//           <label className="block text-sm font-medium mb-1">To Date</label>
//           <input
//             type="date"
//             className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
//             value={dateRange.to}
//             onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
//             min={dateRange.from}
//             disabled={loading}
//           />
//         </div>
//       </div>

//       {/* Location Distribution Chart */}
//       <div className="mt-8">
//         <div className="font-semibold mb-2 flex items-center">
//           <FiPieChart className="mr-1" /> Attendance by Location
//         </div>
//         {locationData.length > 0 ? (
//           <div className="h-96"> {/* Increased height for better visibility */}
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={locationData}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={100}
//                   innerRadius={40}
//                   label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                   labelLine={false}
//                 >
//                   {locationData.map((entry, idx) => (
//                     <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Legend 
//                   layout="vertical" 
//                   verticalAlign="middle" 
//                   align="right"
//                   wrapperStyle={{ paddingLeft: '20px' }}
//                 />
//                 <Tooltip 
//                   formatter={(value) => [`${value} entries`, 'Count']}
//                   labelFormatter={(name) => `Location: ${name}`}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         ) : (
//           <div className="text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
//             No location distribution data available
//           </div>
//         )}
//       </div>

//       {/* Individual Faculty Attendance (when a faculty is selected) */}
//       {selectedFaculty !== 'all' && (
//         <div className="mt-8">
//           <div className="font-semibold mb-4">
//             Attendance Details for {facultyList.find(f => f.erpid === selectedFaculty)?.name || 'Selected Faculty'}
//           </div>
//           {facultyAttendanceData.length > 0 ? (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {facultyAttendanceData.map((item, index) => (
//                     <tr key={index}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : (
//             <div className="text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
//               No attendance data available for selected faculty
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default FacultyAttendanceOverview;

