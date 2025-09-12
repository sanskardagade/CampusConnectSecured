import React, { useEffect, useState } from 'react';

const brandColors = {
  primary: "#b22b2f",
  secondary: "#d1a550",
  accent: "#6b6d71",
  primaryLight: "#d86a6d",
  secondaryLight: "#e8d4a3",
  accentLight: "#9a9ca0",
};

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjectsAndAttendance = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch subjects and attendance data in parallel
        const [subjectsRes, attendanceRes] = await Promise.all([
          fetch('http://69.62.83.14:9000/api/students/subjects', { headers }),
          fetch('http://69.62.83.14:9000/api/students/attendance-summary', { headers })
        ]);

        if (!subjectsRes.ok) {
          throw new Error('Failed to fetch subjects from server');
        }
        if (!attendanceRes.ok) {
          throw new Error('Failed to fetch attendance data from server');
        }

        const subjectsData = await subjectsRes.json();
        const attendanceData = await attendanceRes.json();

        console.log('Subjects data:', subjectsData);
        console.log('Attendance data:', attendanceData);

        // Handle different response formats
        const subjectsList = Array.isArray(subjectsData) ? subjectsData : (subjectsData.data || subjectsData.subjects || []);
        const attendanceList = Array.isArray(attendanceData) ? attendanceData : (attendanceData.data || attendanceData.attendance || []);

        if (subjectsList.length === 0) {
          setSubjects([]);
          setError('No Subjects found');
          return;
        }

        // Create a map of attendance data by subject_id for quick lookup
        const attendanceMap = {};
        attendanceList.forEach(attendance => {
          attendanceMap[attendance.subject_id] = {
            total_sessions: attendance.total_sessions || 0,
            attended_sessions: attendance.attended_sessions || 0,
            subject_name: attendance.subject_name,
            student_erpid: attendance.student_erpid,
            updated_at: attendance.updated_at
          };
        });

        // Combine subjects with their attendance data
        const combinedData = subjectsList.map(subject => {
          const attendanceInfo = attendanceMap[subject.subject_id];
          return {
            ...subject,
            total_sessions: attendanceInfo?.total_sessions || 0,
            attended_sessions: attendanceInfo?.attended_sessions || 0,
            student_erpid: attendanceInfo?.student_erpid || null,
            updated_at: attendanceInfo?.updated_at || null
          };
        });

        console.log('Combined data:', combinedData);

        setSubjects(combinedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load subjects and attendance data');
        setSubjects([]);
      }
      setLoading(false);
    };

    fetchSubjectsAndAttendance();
  }, []);

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return '#22c55e'; // Green
    if (percentage >= 60) return brandColors.secondary; // Yellow
    return brandColors.primary; // Red
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: brandColors.primary }}>
        Your Subjects & Attendance
      </h1>

      {loading && <div className="text-center text-gray-500">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.length === 0 ? (
            <div className="text-gray-500">No subjects found.</div>
          ) : (
            subjects.map((subj) => {
              const percentage =
                subj.total_sessions > 0
                  ? ((subj.attended_sessions / subj.total_sessions) * 100).toFixed(2)
                  : 0;

              const absent = subj.total_sessions - subj.attended_sessions;

              return (
                <div
                  key={subj.subject_id}
                  className="bg-white rounded-lg shadow-lg p-4 border-l-4 hover:shadow-xl transition-shadow"
                  style={{ borderColor: brandColors.primary }}
                >
                  <div className="font-semibold text-lg mb-2" style={{ color: brandColors.primary }}>
                    {subj.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Code: <span style={{ color: brandColors.secondary }}>{subj.subject_code}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Year {subj.year} • Semester {subj.semester}
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="text-sm font-medium mb-2" style={{ color: brandColors.accent }}>
                      Attendance Summary
                    </div>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Sessions:</span>
                      <span className="text-sm text-blue-600 font-medium">{subj.total_sessions}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Present:</span>
                      <span className="text-sm font-medium text-green-600">{subj.attended_sessions}</span>
                    </div>

                    <div className="flex justify-between mb-3">
                      <span className="text-sm text-gray-600">Absent:</span>
                      <span className="text-sm font-medium text-red-600">{absent}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Percentage:</span>
                      <span
                        className="text-sm font-bold px-2 py-1 rounded"
                        style={{
                          color: getAttendanceColor(percentage),
                          backgroundColor: `${getAttendanceColor(percentage)}15`
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: getAttendanceColor(percentage)
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mt-3">
                    Subject ID: {subj.subject_id}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;