import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ---------- Date helpers ----------
const pad2 = (n) => String(n).padStart(2, '0');

function ymdLocalFromDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayLocalYMD() {
  return ymdLocalFromDate(new Date());
}

// ---------- Approval remark ----------
const getApprovalRemark = (hodApproval, principalApproval, finalStatus) => {
  if (finalStatus === 'Approved') return 'Approved by both HOD and Principal';
  if (finalStatus === 'Rejected') return 'Leave application rejected';
  if (principalApproval === 'Approved') return 'Approved by Principal, pending final approval';
  if (hodApproval === 'Approved') return 'Approved by HOD, pending Principal approval';
  return 'Awaiting initial approval';
};

const SecurityDashboard = () => {
  const [facultyOnLeave, setFacultyOnLeave] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(null);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('today');
  const [customDate, setCustomDate] = useState(todayLocalYMD());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editErpId, setEditErpId] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // -------- Selected date --------
  const getSelectedDateYMD = () => {
    if (filter === 'today') return todayLocalYMD();
    if (filter === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return ymdLocalFromDate(d);
    }
    if (filter === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return ymdLocalFromDate(d);
    }
    return customDate;
  };

  // -------- Fetch leaves for selected date --------
  const fetchLeaves = async () => {
    console.log('[fetchLeaves] Fetching leaves for date:', getSelectedDateYMD());
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://69.62.83.14:9000/api/registrar/security-dashboard', {
        params: { date: getSelectedDateYMD() },
      });

      console.log('[fetchLeaves] Response:', res.data);
      
      if (!Array.isArray(res.data)) {
        throw new Error('Invalid response format: expected array');
      }

      setFacultyOnLeave(res.data);
      
    } catch (err) {
      const message = err.response?.data?.error || 
                     err.response?.data?.details || 
                     err.message || 
                     'Failed to fetch leaves';
      console.error('[fetchLeaves] ERROR:', message, err);
      setError(message);
      setFacultyOnLeave([]);
    } finally {
      setLoading(false);
    }
  };

  // -------- Debug endpoints --------
  const fetchDebugData = async () => {
    try {
      const res = await axios.get('http://69.62.83.14:9000/api/registrar/security-dashboard/debug');
      setDebugData(res.data);
    } catch (err) {
      console.error('Error fetching debug data:', err);
    }
  };

  const fetchFacultyStatus = async (erpId) => {
    try {
      const res = await axios.get(`http://69.62.83.14:9000/api/registrar/security-dashboard/status/${erpId}`);
      console.log('Faculty status:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching faculty status:', err);
      return null;
    }
  };

  const fetchExitedToday = async () => {
    try {
      const res = await axios.get('http://69.62.83.14:9000/api/registrar/security-dashboard/exited-today');
      console.log('Exited today:', res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching exited faculty:', err);
      return null;
    }
  };

  // -------- Actions --------
  const handleMarkExit = async (erpStaffId) => {
    console.log('[handleMarkExit] erpStaffId:', erpStaffId);
    setMarking(erpStaffId);
    setSuccess('');
    setError('');
    try {
      const r = await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/exit', { erpStaffId });
      console.log('[handleMarkExit] Response:', r.data);
      setSuccess(r.data.message || 'Exit marked successfully!');
      fetchLeaves();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details || 
                          'Failed to mark exit.';
      console.error('[handleMarkExit] ERROR:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setMarking(null);
    }
  };

  const handleUnmarkExit = async (erpStaffId) => {
    console.log('[handleUnmarkExit] erpStaffId:', erpStaffId);
    setMarking(erpStaffId);
    setSuccess('');
    setError('');
    try {
      const r = await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/unexit', { erpStaffId });
      console.log('[handleUnmarkExit] Response:', r.data);
      setSuccess(r.data.message || 'Exit unmarked successfully!');
      fetchLeaves();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details || 
                          'Failed to unmark exit.';
      console.error('[handleUnmarkExit] ERROR:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setMarking(null);
    }
  };

  const confirmEditExit = async () => {
    if (!editErpId) return;
    await handleUnmarkExit(editErpId);
    setShowEditModal(false);
    setEditErpId(null);
  };

  // Effects
  useEffect(() => {
    fetchLeaves();
  }, [filter, customDate]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // -------- UI --------
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">Security Dashboard</h1>
              <p className="text-gray-600">View and manage faculty leave applications</p>
              <p className="text-sm text-gray-500 mt-1">
                Showing data for: <span className="font-semibold">{getSelectedDateYMD()}</span>
              </p>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button
                onClick={fetchLeaves}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              {/* <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showDebug ? 'Hide Debug' : 'Debug Info'}
              </button> */}
            </div>
          </div>

          {/* Debug Panel */}
          {showDebug && debugData && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-2">Debug Information</h3>
              <div className="text-sm text-yellow-700">
                <p>Total records: {debugData.total_records}</p>
                <p>Today's records: {debugData.today_records}</p>
                <p>Current date: {debugData.today}</p>
              </div>
              <button
                onClick={fetchDebugData}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm"
              >
                Refresh Debug
              </button>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center mb-4 font-semibold p-2 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-700 text-center mb-4 font-semibold p-2 bg-green-100 rounded-lg">
              {success}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              className={`px-3 py-2 rounded-lg font-semibold ${filter === 'today' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('today')}
              disabled={loading}
            >
              Today
            </button>
            <button
              className={`px-3 py-2 rounded-lg font-semibold ${filter === 'yesterday' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('yesterday')}
              disabled={loading}
            >
              Yesterday
            </button>
            <button
              className={`px-3 py-2 rounded-lg font-semibold ${filter === 'tomorrow' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('tomorrow')}
              disabled={loading}
            >
              Tomorrow
            </button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setFilter('custom');
                }}
                className="px-2 py-2 border rounded-lg text-gray-700 bg-gray-50"
                max={todayLocalYMD()}
                disabled={loading}
              />
              <button
                className={`px-3 py-2 rounded-lg font-semibold ${filter === 'custom' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setFilter('custom')}
                disabled={loading}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
              <p className="mt-2">Loading leave data...</p>
            </div>
          ) : facultyOnLeave.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">No leave applications found for {getSelectedDateYMD()}</p>
              <p className="text-sm mt-2">Try selecting a different date or check if any leave applications exist.</p>
              <button
                onClick={fetchDebugData}
                className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Check Database Contents
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-red-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3 text-left">Faculty Name</th>
                    <th className="px-4 py-3 text-left">ERP ID</th>
                    <th className="px-4 py-3 text-left">Leave Period</th>
                    <th className="px-4 py-3 text-left">Leave Type</th>
                    <th className="px-4 py-3 text-left">Approvals</th>
                    <th className="px-4 py-3 text-center">Exit Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyOnLeave.map((f, index) => {
                    const exitStatus = f.exitStatus || false;
                    const fromDate = formatDate(f.fromDate);
                    const toDate = formatDate(f.toDate);
                    const facultyName = f.faculty_name || f.StaffName || 'Unknown';
                    const erpId = f.ErpStaffId || 'N/A';
                    const leaveType = f.leaveType || 'N/A';
                    const hodApproval = f.HodApproval || 'Pending';
                    const principalApproval = f.PrincipalApproval || 'Pending';
                    const finalStatus = f.FinalStatus || 'Pending';

                    return (
                      <tr key={f.id || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-center">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{facultyName}</td>
                        <td className="px-4 py-3 font-mono text-sm">{erpId}</td>
                        <td className="px-4 py-3">
                          <span className="block">From: {fromDate}</span>
                          <span className="block">To: {toDate}</span>
                        </td>
                        <td className="px-4 py-3">{leaveType}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className="block">HOD: {hodApproval}</span>
                          <span className="block">Principal: {principalApproval}</span>
                          <span className="block">Final: {finalStatus}</span>
                          <span className="block text-xs text-gray-500 mt-1">
                            {getApprovalRemark(hodApproval, principalApproval, finalStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              exitStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {exitStatus ? 'Exited' : 'Not Exited'}
                          </span>
                          {f.exit_time && (
                            <div className="text-xs text-gray-500 mt-1">
                              Exit time: {new Date(f.exit_time).toLocaleTimeString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!exitStatus ? (
                            <button
                              onClick={() => handleMarkExit(erpId)}
                              disabled={marking === erpId || loading}
                              className={`px-4 py-2 rounded-lg text-white bg-red-700 hover:bg-red-800 transition-colors ${
                                (marking === erpId || loading) ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              {marking === erpId ? 'Marking...' : 'Mark Exit'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditErpId(erpId);
                                setShowEditModal(true);
                              }}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Unmark Exit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Unmark Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-center">Unmark Exit</h2>
            <p className="mb-4 text-gray-700 text-center">
              Are you sure you want to unmark exit for faculty ID: <strong>{editErpId}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmEditExit}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={marking}
              >
                {marking ? 'Processing...' : 'Yes, Unmark'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditErpId(null);
                }}
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
                disabled={marking}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
