import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Calendar,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  Table,
  CheckCircle,
  XCircle,
  GraduationCap,
  CalendarDays,
} from "lucide-react";

const StudentDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [viewMode, setViewMode] = useState("charts"); // 'charts' or 'table'
  const [activeTab, setActiveTab] = useState("overall"); // 'overall' or 'subjects'
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [studentData, setStudentData] = useState({
    name: '',
    class: '',
    id: '',
    contactNo: '',
    email: '',
    dob: '',
    year: '',
    division: '',
    rollNo: '',
    gender: '',
    classTeacher: '',
    semester: '',
    departmentId: '',
  
  });
  const [subjectAttendanceData, setSubjectAttendanceData] = useState([]); // now an array
  const [overallAttendance, setOverallAttendance] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Brand colors
  const brandColors = {
    primary: "#b22b2f",
    secondary: "#d1a550",
    accent: "#6b6d71",
    primaryLight: "#d86a6d",
    secondaryLight: "#e8d4a3",
    accentLight: "#9a9ca0",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
  };

  // Subject colors for charts
  const subjectColors = {
    Mathematics: "#b22b2f",
    Physics: "#d1a550",
    Chemistry: "#6b6d71",
    Biology: "#10b981",
    English: "#8b5cf6",
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch student profile
        const profileResponse = await fetch('http://69.62.83.14:9000/api/students/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileResponse.json();
        setStudentData(profileData.data);

        // Fetch subject-wise attendance
        const attendanceResponse = await fetch('http://69.62.83.14:9000/api/students/attendance', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!attendanceResponse.ok) throw new Error('Failed to fetch attendance');
        const attendanceData = await attendanceResponse.json();
        setSubjectAttendanceData(attendanceData.data || []);

        // Fetch overall attendance
        const overallResponse = await fetch('http://69.62.83.14:9000/api/students/attendance/overall', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!overallResponse.ok) throw new Error('Failed to fetch overall attendance');
        const overallData = await overallResponse.json();
        setOverallAttendance(overallData.data);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Remove all dummy attendanceData and related code
  // Use only subjectAttendanceData and overallAttendance for all stats, charts, and tables

  // For period selection, fallback to overallAttendance for all periods
  const getCurrentData = () => overallAttendance;

  const currentData = getCurrentData();

  // For subject chart data
  const subjectChartData = subjectAttendanceData.map((data) => ({
    subject: data.name,
    present: data.present,
    absent: data.absent,
    percentage: data.percentage,
    color: subjectColors[data.name] || brandColors.primary
  }));

  const subjectPieData = subjectAttendanceData.map((data) => ({
    name: data.name,
    value: data.percentage,
    color: subjectColors[data.name] || brandColors.primary
  }));

  const pieData = [
    { name: "Present", value: overallAttendance.present, color: brandColors.primary },
    { name: "Absent", value: overallAttendance.absent, color: brandColors.primaryLight },
  ];

  // For quick stats and charts, use overallAttendance
  // const currentData = overallAttendance; // This line is now redundant

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleDateRangeChange = (field, value) => {
    setCustomDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderDateRangePicker = () => (
    <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <CalendarDays className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Custom Date Range:</span>
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">From:</label>
        <input
          type="date"
          value={customDateRange.startDate}
          onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">To:</label>
        <input
          type="date"
          value={customDateRange.endDate}
          onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {customDateRange.startDate && customDateRange.endDate && (
        <div className="text-sm text-gray-600">
          Showing data from {new Date(customDateRange.startDate).toLocaleDateString()} to{" "}
          {new Date(customDateRange.endDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );

  const renderOverallAttendance = () => (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Classes</p>
              <p className="text-2xl font-bold text-gray-800">{currentData.total}</p>
            </div>
            <BookOpen className="w-8 h-8" style={{ color: brandColors.primary }} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Present</p>
              <p className="text-2xl font-bold" style={{ color: brandColors.success }}>
                {currentData.present}
              </p>
            </div>
            <Award className="w-8 h-8" style={{ color: brandColors.success }} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Absent</p>
              <p className="text-2xl font-bold" style={{ color: brandColors.danger }}>
                {currentData.absent}
              </p>
            </div>
            <Clock className="w-8 h-8" style={{ color: brandColors.danger }} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attendance Rate</p>
              <p className="text-2xl font-bold" style={{ color: brandColors.secondary }}>
                {currentData.percentage}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: brandColors.secondary }} />
          </div>
        </div>
      </div>

      {/* Charts/Table Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6" style={{ color: brandColors.primary }} />
              <h2 className="text-xl font-bold text-gray-800">Attendance Overview</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode("charts")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === "charts" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={viewMode === "charts" ? { backgroundColor: brandColors.primary } : {}}
              >
                <BarChart className="w-4 h-4" />
                <span>Charts</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === "table" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={viewMode === "table" ? { backgroundColor: brandColors.primary } : {}}
              >
                <Table className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Period Selection */}
          <div className="flex flex-wrap gap-2">
            {["daily", "weekly", "monthly", "custom"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPeriod === period ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={selectedPeriod === period ? { backgroundColor: brandColors.secondary } : {}}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {selectedPeriod === "custom" && renderDateRangePicker()}
        </div>
        <div className="p-6">
          {viewMode === "charts" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {selectedPeriod === "custom"
                    ? "Custom Period"
                    : selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}{" "}
                  Attendance
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        stroke={brandColors.accent}
                        fontSize={12}
                      />
                      <YAxis stroke={brandColors.accent} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="present" fill={brandColors.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" fill={brandColors.primaryLight} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="white"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: brandColors.primary }}></div>
                    <span className="text-sm text-gray-600">Present ({currentData.present})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: brandColors.primaryLight }}></div>
                    <span className="text-sm text-gray-600">Absent ({currentData.absent})</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Table View
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedPeriod === "custom"
                  ? "Custom Period"
                  : selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}{" "}
                Attendance Details
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead style={{ backgroundColor: brandColors.secondaryLight }}>
                    <tr>
                      {selectedPeriod === "daily" || selectedPeriod === "custom" ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Total Classes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Present
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Absent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Percentage
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjectAttendanceData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        {selectedPeriod === "daily" || selectedPeriod === "custom" ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.day}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.subject}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.time}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  row.status === "Present" ? "text-white" : "text-white"
                                }`}
                                style={{
                                  backgroundColor: row.status === "Present" ? brandColors.success : brandColors.danger,
                                }}
                              >
                                {row.status === "Present" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {row.status}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.period}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.classes}</td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                              style={{ color: brandColors.success }}
                            >
                              {row.present}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                              style={{ color: brandColors.danger }}
                            >
                              {row.absent}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white`}
                                style={{
                                  backgroundColor:
                                    Number.parseFloat(row.percentage) >= 90
                                      ? brandColors.success
                                      : Number.parseFloat(row.percentage) >= 75
                                        ? brandColors.warning
                                        : brandColors.danger,
                                }}
                              >
                                {row.percentage}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderSubjectAttendance = () => {
    if (subjectAttendanceData.length === 0) {
      return <div className="text-center py-8 text-gray-500">No subject attendance data available</div>;
    }

    return (
      <>
        {/* Subject Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {subjectAttendanceData.map((data) => (
            <div
              key={data.name}
              className="bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subjectColors[data.name] }}></div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full text-white`}
                  style={{
                    backgroundColor:
                      data.percentage >= 90
                        ? brandColors.success
                        : data.percentage >= 75
                          ? brandColors.warning
                          : brandColors.danger,
                  }}
                >
                  {data.percentage}%
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{data.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{data.teacher}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {data.present}/{data.total}
                </span>
                <span>{data.absent} absent</span>
              </div>
            </div>
          ))}
        </div>

        {/* Subject Charts */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="w-6 h-6" style={{ color: brandColors.primary }} />
              <h2 className="text-xl font-bold text-gray-800">Subject-wise Attendance</h2>
            </div>
          </div>

          <div className="p-6">
            {viewMode === "charts" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Subject Bar Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance by Subject</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="subject"
                          stroke={brandColors.accent}
                          fontSize={11}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke={brandColors.accent} fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar dataKey="present" fill={brandColors.primary} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent" fill={brandColors.primaryLight} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject Percentage Pie Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Percentage by Subject</h3>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjectPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="white"
                        >
                          {subjectPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value) => [`${value}%`, "Attendance"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Subject Legend */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {Object.entries(subjectColors).map(([subject, color]) => (
                      <div key={subject} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                        <span className="text-xs text-gray-600">{subject}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Subject Table View
              <div className="overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject-wise Attendance Details</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead style={{ backgroundColor: brandColors.secondaryLight }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Schedule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Total Classes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subjectAttendanceData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: subjectColors[data.name] }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{data.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.teacher}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{data.schedule}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.total}</td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                            style={{ color: brandColors.success }}
                          >
                            {data.present}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                            style={{ color: brandColors.danger }}
                          >
                            {data.absent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white`}
                              style={{
                                backgroundColor:
                                  data.percentage >= 90
                                    ? brandColors.success
                                    : data.percentage >= 75
                                      ? brandColors.warning
                                      : brandColors.danger,
                              }}
                            >
                              {data.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <h2 className="font-bold">Error:</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={`https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg`}
                  alt="Student Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {getGreeting()}, {studentData.name}!
                </h1>
                <p className="text-gray-600">
                  Year {studentData.year} Sem {studentData.semester} • ID: {studentData.erpid}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#b22b2f] to-[#d86a6d] rounded-lg p-4 text-white text-center">
              <div className="text-3xl font-bold">{currentData.percentage}%</div>
              <div className="text-white/90">Overall Attendance</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("overall")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === "overall" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeTab === "overall" ? { backgroundColor: brandColors.primary } : {}}
              >
                <Calendar className="w-4 h-4" />
                <span>Overall Attendance</span>
              </button>
              <button
                onClick={() => setActiveTab("subjects")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === "subjects" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeTab === "subjects" ? { backgroundColor: brandColors.primary } : {}}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Subject-wise Attendance</span>
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode("charts")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === "charts" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={viewMode === "charts" ? { backgroundColor: brandColors.secondary } : {}}
              >
                <BarChart className="w-4 h-4" />
                <span>Charts</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === "table" ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={viewMode === "table" ? { backgroundColor: brandColors.secondary } : {}}
              >
                <Table className="w-4 h-4" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overall" ? renderOverallAttendance() : renderSubjectAttendance()}
      </div>
    </div>
  );
};

export default StudentDashboard;