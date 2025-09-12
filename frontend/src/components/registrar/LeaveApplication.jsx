import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import HeaderMobile from '../common/HeaderMobile';

export default function LeaveApplication() {
  // Get token from localStorage or sessionStorage
  const [token] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [expandedApplication, setExpandedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Pending');

  // Load recent actions from sessionStorage on component mount
  useEffect(() => {
    const savedActions = sessionStorage.getItem('principalRecentActions');
    if (savedActions) {
      setRecentActions(JSON.parse(savedActions));
    }
  }, []);

  // Save recent actions to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('principalRecentActions', JSON.stringify(recentActions));
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
        const response = await axios.get('http://69.62.83.14:9000/api/registrar/faculty-leave-approval', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data && Array.isArray(response.data)) {
          console.log('Received data from backend:', response.data);
          // Log the exact structure of the first application
          if (response.data.length > 0) {
            console.log('First application structure:', response.data[0]);
            console.log('PrincipalApproval value:', response.data[0].PrincipalApproval);
          }
          setLeaveApplications(response.data);
          const pendingApps = response.data.filter(app => 
            app.PrincipalApproval === "Pending"
          );
          console.log('Pending applications:', pendingApps);
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
  }, [token]);

  const handleApprove = async (application) => {
    if (!application || !application.ErpStaffId) {
      console.error('Invalid application data:', application);
      addNotification('Error: Invalid application data');
      return;
    }

    try {
      const response = await axios.put(
        `http://69.62.83.14:9000/api/registrar/faculty-leave-approval/${application.ErpStaffId}`,
        { PrincipalApproval: 'Approved' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        setLeaveApplications(leaveApplications.map(app => 
          app.ErpStaffId === application.ErpStaffId ? 
            {...app, PrincipalApproval: "Approved", FinalStatus: "Approved"} : app
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

  const handleReject = async () => {
    if (!selectedApplication || !selectedApplication.ErpStaffId) {
      console.error('Invalid application data:', selectedApplication);
      addNotification('Error: Invalid application data');
      return;
    }
    try {
      const response = await axios.put(
        `http://69.62.83.14:9000/api/registrar/faculty-leave-approval/${selectedApplication.ErpStaffId}`,
        { PrincipalApproval: 'Rejected' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setLeaveApplications(leaveApplications.map(app => 
          app.ErpStaffId === selectedApplication.ErpStaffId ? 
            {...app, PrincipalApproval: "Rejected", FinalStatus: "Rejected"} : app
        ));
        addNotification(`Rejected leave for ${selectedApplication.StaffName}`);
        addRecentAction({
          type: 'reject',
          staffName: selectedApplication.StaffName,
          leaveType: selectedApplication.leaveType,
          fromDate: selectedApplication.fromDate,
          toDate: selectedApplication.toDate
        });
        setShowRejectModal(false);
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
              <div className="lg:col-span-1">
                {/* Tab Bar for Application Status */}
                <div className="flex mb-4 rounded-lg overflow-hidden shadow divide-x divide-gray-200 bg-white">
                  {['Pending', 'Approved', 'Rejected'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
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
                {/* Pending Approvals */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-red-900">{selectedTab} Applications</h2>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      selectedTab === 'Pending' ? 'bg-yellow-100 text-yellow-800' : selectedTab === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {leaveApplications.filter(app => app.PrincipalApproval === selectedTab).length} {selectedTab.toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {leaveApplications.filter(app => app.PrincipalApproval === selectedTab).map((application, index) => (
                      <div 
                        key={`pending-${application.ErpStaffId}-${index}`}
                        className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                          selectedApplication?.ErpStaffId === application.ErpStaffId 
                            ? (selectedTab === 'Pending' ? 'border-yellow-300 bg-yellow-50' : selectedTab === 'Approved' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50')
                            : (selectedTab === 'Pending' ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300' : selectedTab === 'Approved' ? 'border-green-200 bg-green-50 hover:border-green-300' : 'border-red-200 bg-red-50 hover:border-red-300')
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
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                selectedTab === 'Pending' ? 'bg-yellow-100 text-yellow-800' : selectedTab === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {application.leaveType}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              {formatDate(application.fromDate)} - {formatDate(application.toDate)}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Applied on: {formatDate(application.ApplicationDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {leaveApplications.filter(app => app.PrincipalApproval === selectedTab).length === 0 && (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p>No {selectedTab.toLowerCase()} applications</p>
                        <p className="text-sm mt-1">{selectedTab === 'Pending' ? 'All leave applications have been processed' : `No ${selectedTab.toLowerCase()} leave applications found`}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Actions */}
                <div className="bg-white rounded-lg shadow-md p-4 mt-6">
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
                              {Math.ceil((new Date(selectedApplication.toDate) - new Date(selectedApplication.fromDate)) / (1000 * 60 * 60 * 24))} days
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
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedApplication.PrincipalApproval === "Pending" && (
                      <div className="mt-8 flex justify-end space-x-4">
                        <button 
                          onClick={() => handleApprove(selectedApplication)}
                          className="px-5 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700"
                        >
                          <Check size={18} className="mr-2" />
                          Approve Leave
                        </button>
                        <button 
                          onClick={() => setShowRejectModal(true)}
                          className="px-5 py-2 bg-red-600 text-white rounded-md flex items-center hover:bg-red-700"
                        >
                          <X size={18} className="mr-2" />
                          Reject Leave
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-full min-h-80">
                    <div className="text-red-800 mb-4">
                      <AlertCircle size={48} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No Application Selected</h2>
                    <p className="text-gray-500 text-center max-w-md">
                      Select a leave application from the list to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Rejection Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-red-900">Reject Leave Application</h3>
                  <button 
                    onClick={() => setShowRejectModal(false)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <p className="mb-4 text-gray-700">
                  Are you sure you want to reject {selectedApplication?.StaffName}'s leave application?
                </p>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReject}
                    className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-40">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className="bg-white rounded-lg shadow-lg p-3 flex items-center animate-slideIn"
                style={{
                  animation: "slideIn 0.3s ease-out forwards",
                }}
              >
                <div className="mr-3 text-green-600">
                  <Check size={18} />
                </div>
                <span>{notification.message}</span>
              </div>
            ))}
          </div>

          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}