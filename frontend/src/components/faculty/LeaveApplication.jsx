import { useState, useEffect } from 'react';
import { AlertCircle, Check, Loader2, Clock, CheckCircle, XCircle, Calendar, Info, ChevronRight, User, Bookmark, FileText, PlusCircle } from 'lucide-react';

// Move LeaveApplicationForm outside main component
const LeaveApplicationForm = ({ formData, errors, isSubmitting, handleChange, handleSubmit }) => (
  <div className="space-y-6">
    {/* Staff Name (Read-only) */}
    <div>
      <label htmlFor="StaffName" className="block text-sm font-medium text-gray-700">
        Staff Name
      </label>
      <div className="mt-1">
        <input
          id="StaffName"
          name="StaffName"
          type="text"
          value={formData.StaffName}
          readOnly
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-600 focus:border-red-600 sm:text-sm bg-gray-50"
        />
      </div>
    </div>
    {/* ERP Staff ID (Read-only) */}
    <div>
      <label htmlFor="ErpStaffID" className="block text-sm font-medium text-gray-700">
        ERP Staff ID
      </label>
      <div className="mt-1">
        <input
          id="ErpStaffID"
          name="ErpStaffID"
          type="text"
          value={formData.ErpStaffID}
          readOnly
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-600 focus:border-red-600 sm:text-sm bg-gray-50"
        />
      </div>
    </div>
    {/* Date Range */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* From Date */}
      <div>
        <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">
          From Date <span className="text-red-600">*</span>
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            value={formData.fromDate}
            onChange={handleChange}
            className={`appearance-none block w-full pl-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors
            ${errors.fromDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          />
          {errors.fromDate && (
            <p className="mt-2 text-sm text-red-600">{errors.fromDate}</p>
          )}
        </div>
      </div>
      {/* To Date */}
      <div>
        <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">
          To Date <span className="text-red-600">*</span>
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="toDate"
            name="toDate"
            type="date"
            value={formData.toDate}
            onChange={handleChange}
            min={formData.fromDate}
            className={`appearance-none block w-full pl-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors
            ${errors.toDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          />
          {errors.toDate && (
            <p className="mt-2 text-sm text-red-600">{errors.toDate}</p>
          )}
        </div>
      </div>
    </div>
    {/* Leave Type Selection */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Leave Type <span className="text-red-600">*</span>
      </label>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {leaveTypeOptions.map((option) => (
          <div key={option.value} className="relative">
            <input
              id={`leave-type-${option.value}`}
              name="leaveType"
              type="radio"
              value={option.value}
              checked={formData.leaveType === option.value}
              onChange={handleChange}
              className="absolute opacity-0 w-full h-full cursor-pointer z-10"
            />
            <label
              htmlFor={`leave-type-${option.value}`}
              className={`flex items-center p-3 rounded-lg border ${
                formData.leaveType === option.value
                  ? 'bg-red-200 border-red-600 ring-2 ring-red-600'
                  : 'border-gray-200 hover:bg-gray-50'
              } cursor-pointer transition-all`}
            >
              <div className={`rounded-full p-1 mr-2 ${option.color.replace('text-', 'bg-').replace('100', '500')}`}>
                {option.icon}
              </div>
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          </div>
        ))}
      </div>
      {errors.leaveType && (
        <p className="mt-2 text-sm text-red-600">{errors.leaveType}</p>
      )}
    </div>
    {/* Reason */}
    <div>
      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
        Reason for Leave <span className="text-red-600">*</span>
      </label>
      <div className="mt-1">
        <textarea
          id="reason"
          name="reason"
          rows={4}
          value={formData.reason}
          onChange={handleChange}
          className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
          focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors
          ${errors.reason ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          placeholder="Please provide a detailed reason for your leave application"
        />
        {errors.reason && (
          <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
        )}
      </div>
    </div>
    {/* Submit Button */}
    <div>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`group relative w-full flex justify-center py-2 px-4 border border-transparent 
        text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600
        transition-colors duration-200 ease-in-out
        ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Submitting...
          </>
        ) : (
          <>
            <PlusCircle className="-ml-1 mr-2 h-4 w-4" />
            Submit Application
          </>
        )}
      </button>
    </div>
  </div>
);

// Move leaveTypeOptions outside so it's available to all
const leaveTypeOptions = [
  { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-4 w-4" /> },
  { value: 'academic', label: 'Academic Leave', color: 'bg-blue-100 text-blue-800', icon: <Bookmark className="h-4 w-4" /> },
  { value: 'emergency', label: 'Emergency Leave', color: 'bg-orange-100 text-orange-800', icon: <Info className="h-4 w-4" /> },
  { value: 'maternity', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-800', icon: <User className="h-4 w-4" /> },
  { value: 'family', label: 'Family Function', color: 'bg-purple-100 text-purple-800', icon: <User className="h-4 w-4" /> },
  { value: 'travel', label: 'Travel Leave', color: 'bg-green-100 text-green-800', icon: <ChevronRight className="h-4 w-4" /> },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800', icon: <FileText className="h-4 w-4" /> }
];

// Helper functions outside
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const getStatusBadge = (leave) => {
  if (leave.FinalStatus === 'Approved') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" /> Approved
      </span>
    );
  }
  if (leave.HodApproval === 'Approved' && leave.PrincipalApproval === 'Pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Clock className="h-3 w-3 mr-1" /> Pending Principal Approval
      </span>
    );
  }
  if (leave.HodApproval === 'Pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" /> Pending HOD Approval
      </span>
    );
  }
  if (leave.FinalStatus === 'Rejected') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      <Clock className="h-3 w-3 mr-1" /> Pending
    </span>
  );
};
const getLeaveTypeBadge = (leaveType) => {
  const leaveOption = leaveTypeOptions.find(option => option.value === leaveType) || leaveTypeOptions[6];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leaveOption.color}`}>
      {leaveOption.icon}
      <span className="ml-1">{leaveOption.label}</span>
    </span>
  );
};

// Move PendingApprovals outside
const PendingApprovals = ({ leaveApplications, isLoading }) => {
  const pendingApplications = leaveApplications.filter(
    leave => leave.FinalStatus !== 'Approved' && 
            leave.FinalStatus !== 'Rejected' &&
            !(leave.HodApproval === 'Approved' && leave.PrincipalApproval === 'Approved')
  );
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="animate-spin h-8 w-8 mx-auto text-red-600" />
        <p className="mt-2 text-gray-600">Loading leave applications...</p>
      </div>
    );
  }
  if (pendingApplications.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No pending leave applications found</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {pendingApplications.map((leave) => (
        <div key={leave.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getLeaveTypeBadge(leave.leaveType)}
                {getStatusBadge(leave)}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Staff Name: {leave.StaffName}</p>
                <p className="font-medium">Duration: {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}</p>
                <p className="mt-1">Reason: {leave.reason}</p>
                <p className="mt-1">Applied on: {formatDate(leave.ApplicationDate)}</p>
                <p className="mt-1">ERP Staff ID: {leave.ErpStaffId}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-gray-700 font-medium">HOD Status:</p>
                    <p className="text-gray-600">{leave.HodApproval}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-gray-700 font-medium">Principal Status:</p>
                    <p className="text-gray-600">{leave.PrincipalApproval}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Move LeaveHistory outside
const LeaveHistory = ({ leaveApplications, isLoading }) => {
  const historyApplications = leaveApplications.filter(leave => leave.FinalStatus === 'Approved' || leave.FinalStatus === 'Rejected');
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="animate-spin h-8 w-8 mx-auto text-red-600" />
        <p className="mt-2 text-gray-600">Loading leave history...</p>
      </div>
    );
  }
  if (historyApplications.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No leave history found</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {historyApplications.map((leave) => (
        <div key={leave.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getLeaveTypeBadge(leave.leaveType)}
                {getStatusBadge(leave)}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Staff Name: {leave.StaffName}</p>
                <p className="font-medium">Duration: {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}</p>
                <p className="mt-1">Reason: {leave.reason}</p>
                <p className="mt-1">Applied on: {formatDate(leave.ApplicationDate)}</p>
                <p className="mt-1">ERP Staff ID: {leave.ErpStaffId}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-gray-700 font-medium">HOD Status:</p>
                    <p className="text-gray-600">{leave.HodApproval}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <p className="text-gray-700 font-medium">Principal Status:</p>
                    <p className="text-gray-600">{leave.PrincipalApproval}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add LeaveBalancesDisplay component
const LeaveBalancesTable = ({ leaveBalances, leaveApplications, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="animate-spin h-6 w-6 mx-auto text-red-600" />
        <p className="mt-2 text-sm text-gray-600">Loading leave balances...</p>
      </div>
    );
  }

  if (!leaveBalances) {
    return (
      <div className="text-center py-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-700 text-sm">Leave balances not available</p>
      </div>
    );
  }

  // Define leave types and their display names (in the correct order)
  const leaveTypes = [
    { key: 'sick', label: 'Sick Leave' },
    { key: 'academic', label: 'Academic Leave' },
    { key: 'emergency', label: 'Emergency Leave' },
    { key: 'maternity', label: 'Maternity Leave' },
    { key: 'family', label: 'Family Function' },
    { key: 'travel', label: 'Travel Leave' },
    { key: 'other', label: 'Other' },
  ];

  // Helper to calculate consumed days for a leave type
  const getConsumed = (type) => {
    if (!leaveApplications) return 0;
    return leaveApplications
      .filter(
        (leave) =>
          leave.leaveType === type &&
          leave.FinalStatus === 'Approved'
      )
      .reduce((sum, leave) => {
        const from = new Date(leave.fromDate);
        const to = new Date(leave.toDate);
        // +1 to include both start and end dates
        const days = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);
  };

  return (
    <div className="overflow-x-auto mb-6">
      <div className="bg-blue-700 text-white px-4 py-2 rounded-t-md font-semibold">My Leave Balance</div>
      <table className="min-w-full border border-gray-300 rounded-b-md">
        <thead>
          <tr className="bg-orange-200">
            <th className="px-3 py-2 text-left font-bold">Leave Type</th>
            <th className="px-3 py-2 text-left font-bold">Allocation From</th>
            <th className="px-3 py-2 text-left font-bold">Allocation Till</th>
            <th className="px-3 py-2 text-right font-bold">Total</th>
            <th className="px-3 py-2 text-right font-bold">Consumed</th>
            <th className="px-3 py-2 text-right font-bold">Current Balance</th>
          </tr>
        </thead>
        <tbody>
          {leaveTypes.map((type, idx) => {
            const consumed = getConsumed(type.key);
            const current = leaveBalances[type.key] ?? 0;
            const total = consumed + current;
            
            return (
              <tr key={type.key} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50"}>
                <td className="px-3 py-2">{type.label}</td>
                <td className="px-3 py-2">01/07/2025</td>
                <td className="px-3 py-2">31/12/2025</td>
                <td className="px-3 py-2 text-right">{total}</td>
                <td className="px-3 py-2 text-right">{consumed}</td>
                <td className="px-3 py-2 text-right">{current}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function LeaveApplication() {
  // Form state
  const [formData, setFormData] = useState({
    StaffName: '',
    ErpStaffID: '',
    fromDate: '',
    toDate: '',
    reason: '',
    leaveType: 'sick',
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('apply');
  const [isLoading, setIsLoading] = useState(true);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().slice(0, 10);
        const response = await fetch(`http://82.112.238.4:9000/api/faculty/dashboard?date=${today}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setFormData(prevData => ({
          ...prevData,
          StaffName: data.name || '',
          ErpStaffID: data.erpStaffId || ''
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  // Fetch leave applications
  useEffect(() => {
    const fetchLeaveApplications = async () => {
      try {
        const response = await fetch('http://82.112.238.4:9000/api/faculty/leave-apply', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch leave applications');
        }

        const data = await response.json();
        console.log('Leave applications:', data);
        setLeaveApplications(data);
      } catch (error) {
        console.error('Error fetching leave applications:', error);
      }
    };

    if (token) {
      fetchLeaveApplications();
    }
  }, [token, setLeaveApplications]);

  // Fetch leave balances
  useEffect(() => {
    const fetchLeaveBalances = async () => {
      try {
        const response = await fetch('http://82.112.238.4:9000/api/faculty/leave-balances', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No leave balances found for faculty');
            setLeaveBalances(null);
          } else {
            throw new Error('Failed to fetch leave balances');
          }
          return;
        }

        const data = await response.json();
        console.log('Leave balances:', data);
        setLeaveBalances(data);
      } catch (error) {
        console.error('Error fetching leave balances:', error);
        setLeaveBalances(null);
      }
    };

    if (token) {
      fetchLeaveBalances();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ErpStaffID.trim()) {
      newErrors.ErpStaffID = 'Faculty ID is required';
    }
    
    if (!formData.fromDate) {
      newErrors.fromDate = 'From Date is required';
    }
    
    if (!formData.toDate) {
      newErrors.toDate = 'To Date is required';
    } else if (formData.fromDate && new Date(formData.toDate) < new Date(formData.fromDate)) {
      newErrors.toDate = 'To Date cannot be before From Date';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for leave is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Please provide a more detailed reason (min 10 characters)';
    }

    // Check leave balance
    if (leaveBalances && formData.leaveType && formData.fromDate && formData.toDate) {
      const availableLeaves = leaveBalances[formData.leaveType];
      const startDate = new Date(formData.fromDate);
      const endDate = new Date(formData.toDate);
      
      // Set time to midnight to avoid time zone issues
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const requestedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      
      if (availableLeaves < requestedDays) {
        newErrors.leaveType = `Insufficient ${formData.leaveType} leaves. You have ${availableLeaves} days left, but requesting ${requestedDays} days.`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setSubmitStatus(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://82.112.238.4:9000/api/faculty/leave-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        StaffName: formData.StaffName,
        ErpStaffID: formData.ErpStaffID,
        fromDate: '',
        toDate: '',
        reason: '',
        leaveType: 'sick',
      });

      // Refresh leave applications
      const applicationsResponse = await fetch('http://82.112.238.4:9000/api/faculty/leave-apply', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setLeaveApplications(applicationsData);
      }
    } catch (error) {
      console.error('Error submitting leave application:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-red-900 to-red-600 text-white py-6 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl font-bold">Faculty Leave Management</h2>
          <p className="text-center text-indigo-100 mt-1">Efficiently manage your leave applications</p>
        </div>
      </div>
      
      <div className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <div className="sm:hidden">
              <select
                id="tabs"
                name="tabs"
                className="block w-full focus:ring-red-600 focus:border-red-600 border-gray-300 rounded-md"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="apply">Apply For Leave</option>
                <option value="pending">Pending Approvals</option>
                <option value="history">Leave History</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('apply')}
                    className={`${
                      activeTab === 'apply'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center`}
                  >
                    <PlusCircle className={`h-5 w-5 mr-2 ${activeTab === 'apply' ? 'text-red-600' : 'text-gray-400'}`} />
                    Apply For Leave
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`${
                      activeTab === 'pending'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center`}
                  >
                    <Clock className={`h-5 w-5 mr-2 ${activeTab === 'pending' ? 'text-red-600' : 'text-gray-400'}`} />
                    Pending Approvals
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`${
                      activeTab === 'history'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center`}
                  >
                    <FileText className={`h-5 w-5 mr-2 ${activeTab === 'history' ? 'text-red-600' : 'text-gray-400'}`} />
                    Leave History
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {activeTab === 'apply' && (
              <div className="p-6">
                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center mb-6 animate-pulse">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Leave application submitted successfully!</span>
                  </div>
                )}
                
                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center mb-6">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Failed to submit application. Please try again.</span>
                  </div>
                )}
                
                <h3 className="text-xl font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">New Leave Application</h3>
                <LeaveBalancesTable leaveBalances={leaveBalances} leaveApplications={leaveApplications} isLoading={isLoading} />
                <LeaveApplicationForm
                  formData={formData}
                  errors={errors}
                  isSubmitting={isSubmitting}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                />
              </div>
            )}
            
            {activeTab === 'pending' && (
              <div>
                <div className="bg-red-200 px-6 py-4 border-b border-indigo-100">
                  <h3 className="text-lg font-medium text-red-900">Pending Approvals</h3>
                </div>
                <div className="p-6">
                  <PendingApprovals leaveApplications={leaveApplications} isLoading={isLoading} />
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="bg-red-200 px-6 py-4 border-b border-indigo-100">
                  <h3 className="text-lg font-medium text-red-900">Leave History</h3>
                </div>
                <div className="p-6">
                  <LeaveHistory leaveApplications={leaveApplications} isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 