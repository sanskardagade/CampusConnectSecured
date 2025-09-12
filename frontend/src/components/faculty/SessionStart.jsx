import { useState, useEffect } from "react";
import axios from "axios";

export default function SessionStart({ isOpen, onClose }) {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // State for subjects
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://69.62.83.14:9000/api/faculty/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setSubjects(data || []);
      } catch (err) {
        setError('Failed to fetch subjects');
        console.error('Error fetching subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch department_id for faculty
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchDepartmentId = async () => {
      try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(
          `http://69.62.83.14:9000/api/faculty/dashboard?date=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data?.department) {
          setFormData(prev => ({ ...prev, department_id: response.data.department }));
        }
      } catch (err) {
        console.error('Failed to fetch department_id:', err);
      }
    };

    fetchDepartmentId();
  }, [isOpen]);

  // Form state
  const [formData, setFormData] = useState({
    subject_id: "",
    department_id: "",
    year: "",
    semester: "",
    division: "",
    batch: "",
    session_date: new Date().toISOString().split('T')[0],
    start_time: "",
    end_time: "",
    location: ""
  });

  const [loading, setLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Get selected subject name
  const getSelectedSubjectName = () => {
    if (!formData.subject_id) return "";
    const selectedSubject = subjects.find(s => 
      s.subject_id.toString() === formData.subject_id.toString()
    );
    return selectedSubject?.name || "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      'subject_id', 
      'department_id', 
      'year', 
      'semester', 
      'division', 
      'start_time', 
      'end_time', 
      'location'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (new Date(`2000-01-01T${formData.end_time}`) <= new Date(`2000-01-01T${formData.start_time}`)) {
      setError("End time must be after start time");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSessionStart = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedSubject = subjects.find(s => 
        s.subject_id.toString() === formData.subject_id.toString()
      );

      if (!selectedSubject) {
        setError("Invalid subject selected");
        return;
      }

      const sessionData = {
        ...formData,
        subject: selectedSubject.name,
        batch: formData.batch || null
      };

      const response = await axios.post(
        'http://69.62.83.14:9000/api/faculty/start-session',
        sessionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setSessionId(response.data.session_id || response.data.id);
      setSessionCreated(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Error starting session");
      console.error("Session start error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: "",
      department_id: "",
      year: "",
      semester: "",
      division: "",
      batch: "",
      session_date: new Date().toISOString().split('T')[0],
      start_time: "",
      end_time: "",
      location: ""
    });
    setSessionCreated(false);
    setSessionId(null);
    setError(null);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" 
      onClick={handleOverlayClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold mb-4">Start Attendance Session</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {!sessionCreated ? (
          <form className="space-y-4">
            {/* Subject Selection */}
            <div>
              <label className="block mb-2 font-medium">Subject *</label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleInputChange}
                className="border rounded px-3 py-2 w-full"
                disabled={loadingSubjects}
              >
                <option value="">{loadingSubjects ? "Loading..." : "Select Subject"}</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department ID */}
            <div>
              <label className="block mb-2 font-medium">Department *</label>
              <input
                type="text"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="border rounded px-3 py-2 w-full bg-gray-100"
                readOnly
              />
            </div>

            {/* Year and Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4].map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </div>

            {/* Division and Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Division *</label>
                <input
                  type="text"
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="A, B, C, etc."
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Batch (Optional)</label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="B1, B2, etc."
                />
              </div>
            </div>

            {/* Session Date */}
            <div>
              <label className="block mb-2 font-medium">Session Date</label>
              <input
                type="date"
                name="session_date"
                value={formData.session_date}
                onChange={handleInputChange}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Start Time *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">End Time *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block mb-2 font-medium">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="border rounded px-3 py-2 w-full"
                placeholder="Room 101, Lab A, etc."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSessionStart}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 flex-1"
              >
                {loading ? "Starting..." : "Start Session"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                Reset
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">Session Started Successfully!</h3>
              {sessionId && (
                <p className="text-gray-600 mb-4">Session ID: <span className="font-mono">{sessionId}</span></p>
              )}
              <div className="space-y-2 text-gray-700 text-left bg-gray-50 p-4 rounded">
                <p><span className="font-medium">Subject:</span> {getSelectedSubjectName()}</p>
                <p><span className="font-medium">Department:</span> {formData.department_id}</p>
                <p><span className="font-medium">Class:</span> Year {formData.year}, Sem {formData.semester}</p>
                <p><span className="font-medium">Division:</span> {formData.division} {formData.batch && `(Batch ${formData.batch})`}</p>
                <p><span className="font-medium">Date:</span> {formData.session_date}</p>
                <p><span className="font-medium">Time:</span> {formData.start_time} - {formData.end_time}</p>
                <p><span className="font-medium">Location:</span> {formData.location}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex-1"
              >
                Start Another Session
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded flex-1"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}