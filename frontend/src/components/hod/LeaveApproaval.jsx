import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import HeaderMobile from '../common/HeaderMobile';

export default function LeaveApprovalDashboard() {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [expandedApplication, setExpandedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Pending');

  // Load recent actions from sessionStorage on component mount
  useEffect(() => {
    const savedActions = sessionStorage.getItem('hodRecentActions');
    if (savedActions) {
      setRecentActions(JSON.parse(savedActions));
    }
  }, []);

  // Save recent actions to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('hodRecentActions', JSON.stringify(recentActions));
  }, [recentActions]);

  const addRecentAction = (action) => {
    const newAction = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...action
    };
    setRecentActions(prev => [newAction, ...prev].slice(0, 5)); // Keep only last 5 actions
  };

  useEffect(() => {
    const fetchLeaveApplications = async () => {
      try {
        const response = await axios.get('http://69.62.83.14:9000/api/hod/leave-approval');
        
        if (response.data && Array.isArray(response.data)) {
          console.log('Received leave applications:', response.data);
          setLeaveApplications(response.data);
        } else {
          console.error('Invalid data format received:', response.data);
          setLeaveApplications([]);
        }
      } catch (error) {
        console.error('Error fetching leave applications:', error);
        console.error('Error details:', error.response || error.message);
        addNotification('Error fetching leave applications');
        setLeaveApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveApplications();
  }, []);

  const handleApprove = async (application) => {
    if (!application || !application.ErpStaffId) {
      console.error('Invalid application data:', application);
      addNotification('Error: Invalid application data');
      return;
    }

    try {
      const response = await axios.put(`http://69.62.83.14:9000/api/hod/leave-approval/${application.ErpStaffId}`, {
        HodApproval: 'Approved'
      });

      if (response.status === 200) {
        setLeaveApplications(leaveApplications.map(app => 
          app.ErpStaffId === application.ErpStaffId ? 
            {...app, HodApproval: "Approved"} : app
        ));
        
        addNotification(`Approved leave for ${application.StaffName}`);
        addRecentAction({
          type: 'approve',
          staffName: application.StaffName,
          leaveType: application.leaveType,
          fromDate: application.fromDate,
          toDate: application.toDate
        });
        
        if (selectedApplication && selectedApplication.ErpStaffId === application.ErpStaffId) {
          setSelectedApplication(null);
        }
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      addNotification(error.response?.data?.error || 'Error approving leave application');
    }
  };

  const handleReject = async (application) => {
    if (!application || !application.ErpStaffId) {
      console.error('Invalid application data:', application);
      addNotification('Error: Invalid application data');
      return;
    }
    
    try {
      const response = await axios.put(`http://69.62.83.14:9000/api/hod/leave-approval/${application.ErpStaffId}`, {
        HodApproval: 'Rejected'
      });

      if (response.status === 200) {
        setLeaveApplications(leaveApplications.map(app => 
          app.ErpStaffId === application.ErpStaffId ? 
            {...app, HodApproval: "Rejected"} : app
        ));
        
        addNotification(`Rejected leave for ${application.StaffName}`);
        addRecentAction({
          type: 'reject',
          staffName: application.StaffName,
          leaveType: application.leaveType,
          fromDate: application.fromDate,
          toDate: application.toDate
        });
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      addNotification(error.response?.data?.error || 'Error rejecting leave application');
    }
  };

  const addNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message
    };
    setNotifications([...notifications, newNotification]);
    
    setTimeout(() => {
      setNotifications(current => 
        current.filter(note => note.id !== newNotification.id)
      );
    }, 5000);
  };

  const toggleExpand = (id) => {
    setExpandedApplication(expandedApplication === id ? null : id);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <HeaderMobile title="Leaves" />
      <div className="pt-16">
        <div className="flex flex-col min-h-screen bg-gray-50">
          {/* Main Content */}
          <main className="container mx-auto flex-grow p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Pending Approvals and Recent Actions */}
              <div className="lg:col-span-1 space-y-6">
                {/* Pending Approvals */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-red-900">Pending Approvals</h2>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {leaveApplications.filter(app => app.status === selectedTab).length} {selectedTab.toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex mb-4 rounded-lg overflow-hidden shadow divide-x divide-gray-200 bg-white">
                      {['Pending', 'Approved', 'Rejected'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            setSelectedTab(tab);
                            setSelectedApplication(null);
                            setLoading(true);
                            setTimeout(() => setLoading(false), 500); // Simulate loading
                          }}
                          className={`flex-1 px-4 py-2 font-semibold text-sm transition-colors duration-150 ${
                            selectedTab === tab
                              ? (tab === 'Pending' ? 'bg-yellow-100 text-yellow-800' : tab === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span className="ml-2 text-red-700 font-medium">Loading...</span>
                      </div>
                    ) : (
                      <>
                        {leaveApplications.filter(app => app.status === selectedTab).map((application, index) => (
                          <div 
                            key={`pending-${application.ErpStaffId || index}`}
                            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              selectedApplication?.ErpStaffId === application.ErpStaffId 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                            }`}
                            onClick={() => setSelectedApplication(application)}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-red-100 overflow-hidden mr-3 flex items-center justify-center">
                                <span className="text-red-800 font-medium">
                                  {application.StaffName.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-medium text-gray-900">{application.StaffName}</span>
                                    <p className="text-xs text-gray-500 mt-1">ID: {application.ErpStaffId}</p>
                                  </div>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                    {application.leaveType}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                  {formatDate(application.fromDate)} - {formatDate(application.toDate)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {leaveApplications.filter(app => app.status === selectedTab).length === 0 && (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p>No {selectedTab.toLowerCase()} applications</p>
                            <p className="text-sm mt-1">{selectedTab === 'Pending' ? 'All leave applications have been processed' : `No ${selectedTab.toLowerCase()} leave applications found`}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Recent Actions */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-red-900">Recent Actions</h2>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    {recentActions.map((action) => (
                      <div 
                        key={action.id}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              {action.type === 'approve' ? (
                                <Check className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <X className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              <span className="font-medium text-gray-900">
                                {action.type === 'approve' ? 'Approved' : 'Rejected'} leave for {action.staffName}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {action.leaveType} • {formatDate(action.fromDate)} - {formatDate(action.toDate)}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {recentActions.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p>No recent actions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Application Details */}
              <div className="lg:col-span-2">
                {selectedApplication ? (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-red-900">Leave Application Details</h2>
                        <p className="text-sm text-gray-500">Submitted on {formatDate(selectedApplication.ApplicationDate)}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedApplication(null)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Faculty Info */}
                      <div className="md:col-span-1">
                        <h3 className="text-lg font-medium text-red-800 mb-3">Faculty Information</h3>
                        <div className="flex items-center mb-4">
                          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mr-3">
                            <span className="flex items-center justify-center h-full text-gray-600 text-xl">
                              {selectedApplication.StaffName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{selectedApplication.StaffName}</h4>
                            <p className="text-xs text-gray-500">ID: {selectedApplication.ErpStaffId}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Leave Info */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-red-800 mb-3">Leave Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Leave Type</p>
                            <p className="font-medium">{selectedApplication.leaveType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium">
                              {(() => {
                                const startDate = new Date(selectedApplication.fromDate);
                                const endDate = new Date(selectedApplication.toDate);
                                startDate.setHours(0, 0, 0, 0);
                                endDate.setHours(0, 0, 0, 0);
                                const diffTime = endDate.getTime() - startDate.getTime();
                                return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              })()} days
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">From</p>
                            <p className="font-medium">{formatDate(selectedApplication.fromDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">To</p>
                            <p className="font-medium">{formatDate(selectedApplication.toDate)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Reason</p>
                          <p className="p-3 bg-gray-50 rounded-md mt-1">{selectedApplication.reason}</p>
                        </div>

                        {/* Action Buttons */}
                        {selectedApplication.status === "Pending" && (
                          <div className="mt-6 flex justify-end space-x-4">
                            <button
                              onClick={() => handleReject(selectedApplication)}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center"
                            >
                              <X size={18} className="mr-2" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(selectedApplication)}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                            >
                              <Check size={18} className="mr-2" />
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>Select a leave application to view details</p>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Notifications */}
          <div className="fixed bottom-4 right-4 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="bg-white rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out"
              >
                <p className="text-gray-800">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}