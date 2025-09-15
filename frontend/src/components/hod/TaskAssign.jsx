import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper to decode JWT and extract departmentId
function getDepartmentIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.departmentId || null;
  } catch (e) {
    return null;
  }
}

// Helper to get local ISO string (without Z, with local time)
function getLocalISOString() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISO = new Date(now - tzOffset).toISOString().slice(0, -1); // Remove 'Z'
  return localISO;
}
  
function TaskAssign() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [task, setTask] = useState("");
  const [assignStatus, setAssignStatus] = useState("");
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [manualFileUrl, setManualFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [lastAssignedTask, setLastAssignedTask] = useState(null);
  const [assignedTasksHistory, setAssignedTasksHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [heading, setHeading] = useState("");

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    const fetchFaculty = async () => {
      setLoading(true);
      setError("");
      try {
        const departmentId = getDepartmentIdFromToken();
        if (!departmentId) {
          setError("No departmentId found in token. Please log in again.");
          setLoading(false);
          return;
        }
        const res = await axios.get(
          `http://localhost:5000/api/hod/assign-task?departmentId=${departmentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setFaculty(res.data.faculty || []);
      } catch (err) {
        setError("Failed to fetch faculty");
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  useEffect(() => {
    const fetchAssignedTasksHistory = async () => {
      setLoadingHistory(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/hod/assigned-tasks/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignedTasksHistory(res.data.tasks || []);
      } catch (err) {
        setAssignedTasksHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchAssignedTasksHistory();
  }, []);

  // Filtered faculty list based on search
  const filteredFaculty = faculty.filter(f =>
    (f.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (f.erpid?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (f.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  // Handle checkbox change
  const handleCheckboxChange = (facultyId) => {
    setSelectedFacultyIds(prev => {
      if (prev.includes(facultyId)) {
        return prev.filter(id => id !== facultyId);
      } else {
        return [...prev, facultyId];
      }
    });
  };

  // Get selected faculty details
  const selectedFaculty = faculty.filter(f => selectedFacultyIds.includes(f.id));

  // Clear all selections
  const clearSelections = () => {
    setSelectedFacultyIds([]);
  };

  // Handle file input change
  const handleFileChange = async (e) => {
    setUploadError("");
    setFileUrl("");
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (!selectedFile) return;
    setUploading(true);
    try {
      // Upload to Cloudinary (replace with your own upload preset and cloud name)
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "your_upload_preset"); // <-- replace
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/your_cloud_name/auto/upload", // <-- replace
        formData
      );
      setFileUrl(response.data.secure_url);
    } catch (err) {
      setUploadError("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Handle task assignment
  const handleAssignTask = async () => {
    setAssignStatus("");
    if (!task.trim() || selectedFaculty.length === 0) {
      setAssignStatus("Please select at least one faculty and enter a task.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Prefer uploaded fileUrl, else use manualFileUrl
      const urlToSend = fileUrl || manualFileUrl || "";
      // Send local time in ISO format (not UTC)
      const localCreatedAt = getLocalISOString();
      const timezoneOffset = new Date().getTimezoneOffset();
      const res = await axios.post(
        "http://localhost:5000/api/hod/assign-task",
        {
          heading: heading.trim(),
          facultyErpIds: selectedFaculty.map(f => f.erpid),
          message: task.trim(),
          fileUrl: urlToSend,
          deadline: deadline || null,
          createdAt: localCreatedAt,
          timezoneOffset: timezoneOffset
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Build faculty names string
      const facultyNames = selectedFaculty.map(f => f.name).join(', ');
      const successMsg = (res.data.message || "Task assigned successfully!") + `\nAssigned to: ${facultyNames}`;
      setAssignStatus(successMsg);
      setLastAssignedTask({
        message: task.trim(),
        fileUrl: urlToSend
      });
      setTask("");
      setFile(null);
      setFileUrl("");
      setManualFileUrl("");
      setDeadline("");
      setHeading("");
      clearSelections();
    } catch (err) {
      let msg = "Failed to assign task.";
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setAssignStatus(msg);
      setLastAssignedTask(null);
    }
  };

  // Maroon theme colors
  const maroon = '#b22b2f';
  const maroonLight = '#fbeaea';
  const maroonLighter = '#fff5f5';
  const maroonAccent = '#e57373';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${maroonLighter} 0%, white 60%, ${maroonLight} 100%)`, padding: 0 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56,
            background: `linear-gradient(90deg, ${maroon} 0%, ${maroonAccent} 100%)`,
            borderRadius: '50%', marginBottom: 16
          }}>
            <span style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>TA</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: maroon, margin: 0 }}>Task Assignment</h1>
          <p style={{ color: maroon, fontSize: 15, margin: 0, marginTop: 4 }}>Assign tasks to faculty members efficiently</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(178,43,47,0.08)', border: `1px solid ${maroonLight}`, marginBottom: 32, padding: 28 }}>
      {/* Search Box with Dropdown */}
          <div className="dropdown-container" style={{ position: 'relative', marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Search faculty by name, ERP ID, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          style={{ 
                padding: '12px 16px',
                width: '100%',
                border: `1.5px solid ${maroonLight}`,
                borderRadius: 8,
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s',
                marginBottom: 0
          }}
        />
        {/* Dropdown with checkboxes */}
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
                background: 'white',
                border: `1.5px solid ${maroonLight}`,
            borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: 180,
            overflowY: 'auto',
            zIndex: 9999,
                boxShadow: '0 4px 16px rgba(178,43,47,0.10)',
                marginTop: 1
          }}>
            {filteredFaculty.length === 0 ? (
                  <div style={{ padding: 16, color: '#888', textAlign: 'center' }}>No faculty found</div>
            ) : (
              filteredFaculty.map(f => (
                <div 
                  key={f.id} 
                  style={{
                        padding: '10px 14px',
                        borderBottom: `1px solid ${maroonLight}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                        background: selectedFacultyIds.includes(f.id) ? maroonLight : 'white',
                        transition: 'background 0.2s',
                        minHeight: 20
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(f.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFacultyIds.includes(f.id)}
                        onChange={() => {}}
                    style={{ 
                          marginRight: 12,
                          minWidth: 16,
                          minHeight: 16,
                          accentColor: maroon,
                          cursor: 'pointer'
                    }}
                  />
                  <span style={{ 
                        fontSize: 15,
                        color: maroon,
                        fontWeight: selectedFacultyIds.includes(f.id) ? 600 : 400
                  }}>
                    {f.name} ({f.erpid}) - {f.email}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Button to close dropdown */}
      {showDropdown && (
        <button 
          onClick={() => setShowDropdown(false)}
          style={{
                marginBottom: 18,
                padding: '7px 18px',
                background: maroon,
            color: 'white',
            border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
                boxShadow: `0 2px 8px 0 ${maroonLight}`
          }}
        >
          Close Dropdown
        </button>
      )}

      {/* Selected Faculty Display */}
      {selectedFaculty.length > 0 && (
            <div style={{ marginTop: 10, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ color: maroon, fontWeight: 700, fontSize: 17, margin: 0 }}>Selected Faculty ({selectedFaculty.length})</h3>
            <button
              onClick={clearSelections}
              style={{
                    padding: '4px 10px',
                    background: maroonAccent,
                color: 'white',
                border: 'none',
                    borderRadius: 5,
                cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500
              }}
            >
              Clear All
            </button>
          </div>
          <div style={{ 
                border: `1px solid ${maroonLight}`,
                borderRadius: 8,
                padding: 12,
                background: maroonLight
          }}>
            {selectedFaculty.map(f => (
              <div key={f.id} style={{ 
                    marginBottom: 7,
                    padding: '7px 10px',
                    background: 'white',
                    borderRadius: 6,
                    border: `1px solid ${maroonLight}`,
                    color: maroon,
                    fontWeight: 500,
                    fontSize: 15
              }}>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 13, color: maroon }}>{f.erpid} | {f.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Assignment Form */}
      {selectedFaculty.length > 0 && (
            <div style={{ marginTop: 18 }}>
          {/* Heading Input */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, color: maroon, fontSize: 15 }}>Heading (optional): </label>
            <input
              type="text"
              value={heading}
              onChange={e => setHeading(e.target.value)}
              placeholder="Enter task heading..."
              style={{
                marginLeft: 10,
                padding: '8px 12px',
                border: `1.5px solid ${maroonLight}`,
                borderRadius: 8,
                fontSize: 15,
                width: '80%'
              }}
            />
          </div>
          {/* Deadline Input */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, color: maroon, fontSize: 15 }}>Deadline (optional): </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{
                marginLeft: 10,
                padding: '8px 12px',
                border: `1.5px solid ${maroonLight}`,
                borderRadius: 8,
                fontSize: 15
              }}
            />
          </div>
          <textarea
            placeholder="Enter task description..."
            value={task}
            onChange={e => setTask(e.target.value)}
            style={{
              width: '100%',
                  height: 90,
                  padding: '10px 14px',
                  border: `1.5px solid ${maroonLight}`,
                  borderRadius: 8,
                  fontSize: 15,
              resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: 12
            }}
          />
          {/* File Upload */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600, color: maroon, fontSize: 15 }}>Attach File (optional): </label>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
                  style={{ marginLeft: 10 }}
            />
                {uploading && <span style={{ marginLeft: 12, color: maroon }}>Uploading...</span>}
                {fileUrl && <span style={{ marginLeft: 12, color: 'green' }}>File uploaded</span>}
                {uploadError && <span style={{ marginLeft: 12, color: 'red' }}>{uploadError}</span>}
          </div>
          {/* Manual File URL Input */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600, color: maroon, fontSize: 15 }}>Or enter file URL: </label>
            <input
              type="text"
              value={manualFileUrl}
              onChange={e => setManualFileUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%',
                    padding: '10px 14px',
                    border: `1.5px solid ${maroonLight}`,
                    borderRadius: 8,
                    marginTop: 4,
                    fontSize: 15,
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            style={{
                  marginTop: 6,
                  padding: '12px 0',
                  width: '100%',
                  background: `linear-gradient(90deg, ${maroon} 0%, ${maroonAccent} 100%)`,
              color: 'white',
              border: 'none',
                  borderRadius: 8,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: `0 2px 8px 0 ${maroonLight}`,
                  opacity: uploading ? 0.7 : 1,
                  transition: 'background 0.2s, opacity 0.2s'
            }}
            onClick={handleAssignTask}
            disabled={uploading}
          >
            Assign Task to Selected Faculty
          </button>
        </div>
      )}

          {/* Status Messages */}
      {assignStatus && (
            <div style={{
              marginTop: 24,
              padding: 18,
              borderRadius: 10,
              background: assignStatus.includes('success') ? maroonLight : '#ffeaea',
              border: `1.5px solid ${assignStatus.includes('success') ? maroonAccent : '#ffb3b3'}`,
              color: assignStatus.includes('success') ? maroon : '#b22b2f',
              fontWeight: 600,
              fontSize: 15,
              whiteSpace: 'pre-line',
              boxShadow: '0 2px 8px 0 #fbeaea'
            }}>
          {assignStatus}
            </div>
      )}
          {/* Last Assigned Task Details */}
      {assignStatus.includes('success') && lastAssignedTask && (
        <div style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 10,
              background: maroonLight,
              border: `1.5px solid ${maroonAccent}`,
              color: maroon,
              fontWeight: 500,
              fontSize: 15,
              boxShadow: '0 2px 8px 0 #fbeaea'
        }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Assigned Task Details:</div>
              <div><span style={{ fontWeight: 600 }}>Message:</span> {lastAssignedTask.message}</div>
          {lastAssignedTask.fileUrl && (
            <div>
                  <span style={{ fontWeight: 600 }}>File URL:</span> <a href={lastAssignedTask.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: maroon, textDecoration: 'underline' }}>{lastAssignedTask.fileUrl}</a>
                </div>
              )}
            </div>
          )}
        </div>
        {/* End Card */}

        {/* Task Assignment History */}
        <div style={{
          marginTop: 32,
          background: maroonLight,
          borderRadius: 10,
          padding: 18,
          maxHeight: 250,
          overflowY: 'auto',
          border: `1.5px solid ${maroonAccent}`
        }}>
          <h3 style={{ color: maroon, fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Task Assignment History</h3>
          {loadingHistory ? (
            <div style={{ color: maroon }}>Loading...</div>
          ) : assignedTasksHistory.length === 0 ? (
            <div style={{ color: '#888' }}>No tasks assigned yet.</div>
          ) : (
            <>
              {console.log("Assigned Task History:", assignedTasksHistory)}
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {assignedTasksHistory.map((task, idx) => (
                  <li key={task.id || idx} style={{
                    background: 'white',
                    borderRadius: 6,
                    border: `1px solid ${maroonLight}`,
                    marginBottom: 8,
                    padding: '10px 12px'
                  }}>
                   {task.heading && (
                     <div style={{ fontWeight: 700, color: maroon, fontSize: 17, marginBottom: 4 }}>{task.heading}</div>
                   )}
                    <div style={{ fontWeight: 600, color: maroon }}>{task.message}</div>
                    {task.fileUrl && (
                      <a href={task.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: maroon, textDecoration: 'underline', fontSize: 13 }}>
                        View Attachment
                      </a>
                    )}
                    {task.deadline && (
                      <div style={{ fontSize: 12, color: maroon, marginTop: 2 }}>Deadline: {new Date(task.deadline).toLocaleDateString()}</div>
                    )}
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Assigned to:
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {task.facultyAssignments && task.facultyAssignments.length > 0 ? (
                          task.facultyAssignments.map((fa, i) => (
                            <li key={i} style={{ color: maroon }}>
                              {fa.name} <span style={{ color: '#555', fontStyle: 'italic' }}>({fa.status})</span>
                            </li>
                          ))
                        ) : (
                          <li style={{ color: '#888' }}>N/A</li>
                        )}
                      </ul>
                      <div>
                        {task.createdAt
                          ? (isNaN(new Date(task.createdAt).getTime())
                              ? <span style={{ color: 'red' }}>Invalid date</span>
                              : new Date(task.createdAt).toLocaleString())
                          : <span style={{ color: '#888' }}>Date not available</span>
                        }
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskAssign;