// src/pages/TranscriptRequestWithMarks.jsx
import React, { useState, useEffect } from "react";

export default function Transcript() {
  // Step tracking
  const [step, setStep] = useState(1);

  // Step 1: Basic details
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    prnno: "",
    dob: "",
    gender: "",
    yearofjoin: "",
    yearofpass: "",
    department_id: "",
    course: "",
    mobno: "",
    emailaddress: "",
    details_file: null, // file input
  });

  // Step 2: Semester marks
  const initialMarksState = Array.from({ length: 8 }, () => ({
    cgpa: "",
    percentage: "",
  }));
  const [semesters, setSemesters] = useState(initialMarksState);

  // Transcript list state
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch("http://82.112.238.4:9000/api/students/transcripts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load transcripts");
      setTranscripts(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e.message || "Failed to load transcripts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, []);

  // Handle basic details
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle CGPA input and auto percentage calculation
  const handleCgpaChange = (index, value) => {
    if (value === "" || (!isNaN(value) && value >= 0 && value <= 10)) {
      const updated = [...semesters];
      updated[index].cgpa = value;
      updated[index].percentage = value ? (parseFloat(value) * 9.5).toFixed(2) : "";
      setSemesters(updated);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Basic validation for step 1
    for (const key in formData) {
      if ((key !== "details_file") && !formData[key]) {
        alert(`Please fill ${key}`);
        return;
      }
    }
    if (!formData.details_file) {
      alert("Please upload your transcript file.");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate semesters
    for (let i = 0; i < semesters.length; i++) {
      if (!semesters[i].cgpa || !semesters[i].percentage) {
        alert(`Please fill CGPA for semester ${i + 1}`);
        return;
      }
    }

    try {
      const data = new FormData();
      // Append basic details
      for (const key in formData) {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      }

      // Step 1: Submit basic transcript request
      const token = localStorage.getItem("token");
      const res1 = await fetch("http://82.112.238.4:9000/api/students/transcript", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result1 = await res1.json();
      if (!res1.ok) throw new Error(result1.message || "Failed to create transcript request");

      const transcriptId = result1.data.request_id;

      // Step 2: Submit transcript details (marks)
      const marksPayload = {
        transcript_id: transcriptId,
        ...semesters.reduce((acc, sem, i) => {
          acc[`sem${i + 1}_cgpa`] = parseFloat(sem.cgpa);
          acc[`sem${i + 1}_percentage`] = parseFloat(sem.percentage);
          return acc;
        }, {}),
      };

      const res2 = await fetch("http://82.112.238.4:9000/api/students/transcript-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(marksPayload),
      });
      const result2 = await res2.json();
      if (!res2.ok) throw new Error(result2.message || "Failed to submit transcript details");

      alert("Transcript request submitted successfully!");
      // Reset form
      setFormData({
        firstname: "",
        lastname: "",
        prnno: "",
        dob: "",
        gender: "",
        yearofjoin: "",
        yearofpass: "",
        department_id: "",
        course: "",
        mobno: "",
        emailaddress: "",
        details_file: null,
      });
      setSemesters(initialMarksState);
      setStep(1);
      // Refresh list
      fetchTranscripts();
    } catch (err) {
      console.error(err);
      alert(err.message || "Server error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-6">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6 mt-6">
        {step === 1 && (
          <form onSubmit={handleNext} className="grid grid-cols-2 gap-4">
            <h2 className="text-2xl text-black font-bold col-span-2 text-center mb-4">Transcript Request</h2>

            {/* First Name */}
            <div>
              <label className="block mb-1 text-black font-medium">First Name</label>
              <input 
                type="text" 
                name="firstname" 
                value={formData.firstname} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="Enter first name"
                required 
              />
            </div>
            {/* Last Name */}
            <div>
              <label className="block mb-1 text-black font-medium">Last Name</label>
              <input 
                type="text" 
                name="lastname" 
                value={formData.lastname} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="Enter last name"
                required 
              />
            </div>
            {/* PRN */}
            <div>
              <label className="block mb-1 text-black font-medium">PRN No</label>
              <input 
                type="text" 
                name="prnno" 
                value={formData.prnno} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="Enter PRN number"
                required 
              />
            </div>
            {/* DOB */}
            <div>
              <label className="block mb-1 text-black font-medium">Date of Birth</label>
              <input 
                type="date" 
                name="dob" 
                value={formData.dob} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black" 
                required 
              />
            </div>
            {/* Gender */}
            <div>
              <label className="block mb-1 text-black font-medium">Gender</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black" 
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {/* Year of Join */}
            <div>
              <label className="block mb-1 text-black font-medium">Year of Join</label>
              <input 
                type="number" 
                name="yearofjoin" 
                value={formData.yearofjoin} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="e.g. 2020"
                required 
              />
            </div>
            {/* Year of Pass */}
            <div>
              <label className="block mb-1 text-black font-medium">Year of Pass</label>
              <input 
                type="number" 
                name="yearofpass" 
                value={formData.yearofpass} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="e.g. 2024"
                required 
              />
            </div>
            {/* Department */}
            <div>
              <label className="block mb-1 text-black font-medium">Department ID</label>
              <input 
                type="number" 
                name="department_id" 
                value={formData.department_id} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="Enter department ID"
                required 
              />
            </div>
            {/* Course */}
            <div>
              <label className="block mb-1 text-black font-medium">Course</label>
              <input 
                type="text" 
                name="course" 
                value={formData.course} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="e.g. Computer Engineering"
                required 
              />
            </div>
            {/* Mobile */}
            <div>
              <label className="block mb-1 text-black font-medium">Mobile No</label>
              <input 
                type="tel" 
                name="mobno" 
                value={formData.mobno} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="Enter mobile number"
                required 
              />
            </div>
            {/* Email */}
            <div className="col-span-2">
              <label className="block mb-1 text-black font-medium">Email Address</label>
              <input 
                type="email" 
                name="emailaddress" 
                value={formData.emailaddress} 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black placeholder-gray-400" 
                placeholder="Enter email address"
                required 
              />
            </div>
            {/* File */}
            <div className="col-span-2">
              <label className="block mb-1 text-black font-medium">Upload Transcript</label>
              <input 
                type="file" 
                name="details_file" 
                onChange={handleChange} 
                className="border p-2 rounded w-full text-black file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                accept=".pdf,.doc,.docx,.jpg,.png"
                required 
              />
            </div>
            <div className="col-span-2 flex justify-end mt-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Next
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <h2 className="text-2xl font-bold text-center mb-4 text-black">Enter Marks / CGPA</h2>
            {semesters.map((sem, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 p-2 border rounded-lg bg-gray-50">
                <div>
                  <label className="block mb-1 font-medium text-black">Semester {i + 1} CGPA</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="10" 
                    value={sem.cgpa} 
                    onChange={(e) => handleCgpaChange(i, e.target.value)} 
                    className="border p-2 rounded w-full text-black placeholder-gray-400" 
                    placeholder="Enter CGPA (0-10)"
                    required 
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-black">Semester {i + 1} Percentage</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="100" 
                    value={sem.percentage} 
                    readOnly 
                    className="border p-2 rounded w-full bg-gray-100 text-black" 
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between mt-4">
              <button type="button" onClick={handleBack} className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">
                Back
              </button>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Submit
              </button>
            </div>
          </form>
        )}

        {/* Transcript Requests List */}
        <div className="mt-8 w-full">
          <h3 className="text-xl font-semibold text-black mb-3">Your Transcript Requests</h3>
          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && transcripts.length === 0 && (
            <p className="text-gray-600">No transcript requests yet.</p>
          )}
          <div className="space-y-3">
            {transcripts.map((t) => (
              <div key={t.request_id} className="border rounded-lg p-3 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-black font-medium">Request #{t.request_id}</p>
                    <p className="text-sm text-gray-600">Uploaded: {t.uploaded_at ? new Date(t.uploaded_at).toLocaleString() : "-"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded text-sm bg-gray-100 text-black">Status: {t.status || "-"}</span>
                    <span className="px-2 py-1 rounded text-sm bg-gray-100 text-black">Fee: {t.feestatus || "-"}</span>
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => setExpandedId(expandedId === t.request_id ? null : t.request_id)}
                    >
                      {expandedId === t.request_id ? "Hide" : "View"} details
                    </button>
                  </div>
                </div>
                {expandedId === t.request_id && (
                  <div className="mt-3 grid gap-2 text-black">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-600">Name:</span> {t.firstname} {t.lastname}</div>
                      <div><span className="text-gray-600">PRN:</span> {t.prnno}</div>
                      <div><span className="text-gray-600">YOJ:</span> {t.yearofjoin}</div>
                      <div><span className="text-gray-600">YOP:</span> {t.yearofpass}</div>
                      <div><span className="text-gray-600">Course:</span> {t.course}</div>
                      <div><span className="text-gray-600">Email:</span> {t.emailaddress}</div>
                  
                    </div>
                    <div className="mt-2">
                      <a
                        href={t.fileurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View uploaded file
                      </a>
                    </div>
                    {/* Transcript PDF link if available */}
                    {t.transcript_url && (
                      <div className="mt-2">
                        <a
                          href={t.transcript_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline font-semibold"
                        >
                          Download Approved Transcript 
                        </a>
                      </div>
                    )}
                    {/* Marks if available */}
                    <div className="mt-3">
                      <h4 className="font-medium">Semester Marks</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {[1,2,3,4,5,6,7,8].map((i) => (
                          <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-semibold">Sem {i}</div>
                            <div>CGPA: {t[`sem${i}_cgpa`] ?? '-'}</div>
                            <div>%: {t[`sem${i}_percentage`] ?? '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}