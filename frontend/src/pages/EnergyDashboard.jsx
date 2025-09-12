import React, { useState, useEffect } from 'react';

const EnergyDataDisplay = () => {
  const [energyData, setEnergyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Helper function to format numbers safely
  const formatNumber = (value, decimals = 2, fallback = 'N/A') => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return typeof num === 'number' && !isNaN(num) ? num.toFixed(decimals) : fallback;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication required. Please login.');
        }

        const response = await fetch('http://69.62.83.14:9000/api/registrar/energy-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from server');
        }

        setEnergyData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate summary statistics with validation
  const calculateSummary = () => {
    if (!Array.isArray(energyData)) return null;

    const summary = {
      totalWatt: 0,
      totalKiloWatt: 0,
      avgVolt: 0,
      avgFrequency: 0,
      avgCurrent: 0,
      avgPowerFactor: 0,
      recordCount: energyData.length,
      latestRecord: energyData[0]?.recorded_at,
      oldestRecord: energyData[energyData.length - 1]?.recorded_at,
      validRecords: 0
    };

    energyData.forEach(item => {
      const watt = typeof item.watt === 'string' ? parseFloat(item.watt) : item.watt;
      const kiloWatt = typeof item.kilo_watt === 'string' ? parseFloat(item.kilo_watt) : item.kilo_watt;
      const volt = typeof item.volt === 'string' ? parseFloat(item.volt) : item.volt;
      const frequency = typeof item.frequency === 'string' ? parseFloat(item.frequency) : item.frequency;
      const current = typeof item.current === 'string' ? parseFloat(item.current) : item.current;
      const powerFactor = typeof item.power_factor === 'string' ? parseFloat(item.power_factor) : item.power_factor;

      if (typeof watt === 'number' && !isNaN(watt)) {
        summary.totalWatt += watt;
        summary.validRecords++;
      }
      if (typeof kiloWatt === 'number' && !isNaN(kiloWatt)) {
        summary.totalKiloWatt += kiloWatt;
      }
      if (typeof volt === 'number' && !isNaN(volt)) {
        summary.avgVolt += volt;
      }
      if (typeof frequency === 'number' && !isNaN(frequency)) {
        summary.avgFrequency += frequency;
      }
      if (typeof current === 'number' && !isNaN(current)) {
        summary.avgCurrent += current;
      }
      if (typeof powerFactor === 'number' && !isNaN(powerFactor)) {
        summary.avgPowerFactor += powerFactor;
      }
    });

    if (summary.validRecords > 0) {
      summary.avgVolt = summary.avgVolt / summary.validRecords;
      summary.avgFrequency = summary.avgFrequency / summary.validRecords;
      summary.avgCurrent = summary.avgCurrent / summary.validRecords;
      summary.avgPowerFactor = summary.avgPowerFactor / summary.validRecords;
    }

    return summary;
  };

  const summary = calculateSummary();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    useEffect(() => {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const response = await fetch('http://69.62.83.14:9000/api/registrar/energy-data', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          const data = await response.json();
          setEnergyData(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p>Loading energy data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 text-red-400' : 'bg-gray-50 text-red-600'}`}>
      <div className="max-w-md text-center p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Error Loading Data</h2>
        <p className="mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className={`px-6 py-2 rounded font-semibold ${darkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
        >
          Retry
        </button>
        {error.includes('Session expired') || error.includes('Authentication') ? (
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Go to Login
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen p-5 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Energy Consumption Dashboard</h1>
          <div className="flex gap-4">
            {/* <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded font-semibold ${darkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold"
            >
              Logout
            </button> */}
          </div>
        </div>

        {energyData.length === 0 ? (
          <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <p>No energy data available</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto mb-10 rounded-lg shadow">
              <table className={`min-w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <thead>
                  <tr className={darkMode ? 'bg-red-900 text-white' : 'bg-red-600 text-white'}>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Class Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Watt (W)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kilo Watt (kW)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Volt (V)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Frequency (Hz)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Current (A)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Power Factor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {energyData.map((item) => (
                    <tr key={item.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.id || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.class_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.watt, 2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.kilo_watt, 4)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.volt, 2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.frequency, 2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.current, 3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.power_factor, 3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.recorded_at ? new Date(item.recorded_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {summary && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 border border-red-900' : 'bg-white border border-red-200'}`}>
                    <h3 className="font-medium mb-2">Total Power</h3>
                    <p>{formatNumber(summary.totalWatt, 2)} W</p>
                    <p>{formatNumber(summary.totalKiloWatt, 4)} kW</p>
                    <p className="text-sm mt-2 opacity-75">{summary.validRecords} valid records</p>
                  </div>
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 border border-red-900' : 'bg-white border border-red-200'}`}>
                    <h3 className="font-medium mb-2">Average Voltage</h3>
                    <p>{formatNumber(summary.avgVolt, 2)} V</p>
                  </div>
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 border border-red-900' : 'bg-white border border-red-200'}`}>
                    <h3 className="font-medium mb-2">Average Frequency</h3>
                    <p>{formatNumber(summary.avgFrequency, 2)} Hz</p>
                  </div>
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 border border-red-900' : 'bg-white border border-red-200'}`}>
                    <h3 className="font-medium mb-2">Average Current</h3>
                    <p>{formatNumber(summary.avgCurrent, 3)} A</p>
                  </div>
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 border border-red-900' : 'bg-white border border-red-200'}`}>
                    <h3 className="font-medium mb-2">Average Power Factor</h3>
                    <p>{formatNumber(summary.avgPowerFactor, 3)}</p>
                  </div>
                  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800 border border-red-900' : 'bg-white border border-red-200'}`}>
                    <h3 className="font-medium mb-2">Time Range</h3>
                    <p>Total Records: {summary.recordCount}</p>
                    <p>Latest: {summary.latestRecord ? new Date(summary.latestRecord).toLocaleString() : 'N/A'}</p>
                    <p>Oldest: {summary.oldestRecord ? new Date(summary.oldestRecord).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EnergyDataDisplay;