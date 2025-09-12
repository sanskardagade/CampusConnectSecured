import React from 'react';

const FacultyLogForFaculty = ({ logs = [], facultyName, selectedDate, setSelectedDate }) => {
  // Group logs by date for display (should only be one date)
  const logsByDate = {};
  logs.forEach(log => {
    const logDate = new Date(log.timestamp).toLocaleDateString();
    if (!logsByDate[logDate]) logsByDate[logDate] = [];
    logsByDate[logDate].push(log);
  });

  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-bold text-red-900 mb-4 text-center">
        Activity Logs for {facultyName}
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
        />
      </div>

      {selectedDate && (
        <div className="text-center text-gray-700 mb-4">
          Showing logs for <span className="font-semibold">{selectedDate}</span>
        </div>
      )}

      {logs && Object.keys(logsByDate).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(logsByDate).map(([logDate, dayLogs]) => {
            const sortedLogs = [...dayLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            const inLog = sortedLogs[0];
            const outLog = sortedLogs.length > 1 ? sortedLogs[sortedLogs.length - 1] : sortedLogs[0];

            return (
              <div key={logDate}>
                <h3 className="text-lg font-bold text-red-800 mb-3">{logDate}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* In Time */}
                  <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center border border-red-100">
                    <div className="text-lg font-semibold text-red-800 mb-2">
                      {inLog.classroom}
                    </div>
                    <div className="text-gray-600 text-sm">
                      In Time: {new Date(inLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {/* Out Time */}
                  <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center border border-red-100">
                    <div className="text-lg font-semibold text-red-800 mb-2">
                      {outLog.classroom}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Out Time: {new Date(outLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Other Activities */}
                {sortedLogs.length > 2 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-red-700 mb-2">Other Activities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sortedLogs.slice(1, -1).map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="bg-gray-50 rounded-lg shadow p-3 flex flex-col items-center border border-red-50"
                        >
                          <div className="text-red-700 text-sm">{log.classroom}</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No logs found.</p>
      )}
    </div>
  );
};

export default FacultyLogForFaculty;
