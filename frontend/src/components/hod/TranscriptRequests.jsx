import React, { useEffect, useState } from "react";

const TranscriptRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState({});
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You are not logged in. Please login to view transcript requests.");
          return;
        }
        const res = await fetch("http://69.62.83.14:9000/api/hod/transcript-requests", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setRequests(data.result);
        else setError(data.message || "Failed to load requests");
      } catch (err) {
        console.error(err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const approveRequest = async (requestId) => {
    try {
      setApproving((prev) => ({ ...prev, [requestId]: true }));
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://69.62.83.14:9000/api/hod/transcript-requests/${requestId}/approve`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");

      // Normalize codes from backend response
      const verification_code = data?.verificationCode || data?.data?.verification_code || null;
      const random_code = data?.randomCode || data?.data?.random_code || null;

      // Update local list with status and verification info
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId
            ? {
                ...r,
                status: "approved",
                approved_at: new Date().toISOString(),
                verification_code,
                random_code,
                ...data.marks, // assuming marks are returned from backend
              }
            : r
        )
      );

      // Auto-generate and upload the transcript PDF after approval
      const baseReq = (selectedReq && selectedReq.request_id === requestId)
        ? selectedReq
        : requests.find((r) => r.request_id === requestId);
      const pdfPayload = baseReq
        ? {
            ...baseReq,
            status: 'approved',
            verification_code,
            random_code,
            ...(data.marks || {}),
          }
        : null;
      if (pdfPayload) {
        await generateAndUploadPdf(pdfPayload);
      }

      // If details modal is open for this request, update it too
      if (selectedReq && selectedReq.request_id === requestId) {
        setSelectedReq({
          ...selectedReq,
          status: 'approved',
          approved_at: new Date().toISOString(),
          verification_code,
          random_code,
          ...(data.marks || {}),
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to approve");
    } finally {
      setApproving((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Helper: generate a PDF with jsPDF and upload to backend route
  const generateAndUploadPdf = async (reqObj) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const line = (y, text) => { doc.text(String(text ?? ''), 14, y); };
      let y = 14;
      doc.setFontSize(16); line(y, `Transcript Request #${reqObj.request_id}`); y += 10;
      doc.setFontSize(11);
      line(y, `Student ERP: ${reqObj.studenterpid}`); y += 6;
      line(y, `Name: ${reqObj.firstname} ${reqObj.lastname}`); y += 6;
      line(y, `PRN: ${reqObj.prnno}`); y += 6;
      line(y, `Course: ${reqObj.course}`); y += 6;
      line(y, `Email: ${reqObj.emailaddress}`); y += 6;
      line(y, `Status: ${reqObj.status || 'pending'}`); y += 6;
      if (reqObj.random_code) {
        const link = `http://localhost:5173/verify/${reqObj.random_code}`;
        
        // print text
        doc.text(`Verification link: ${link}`, 50, y, { link, underline: true });
        
        y += 20; // move down for next line
      }
      if (reqObj.verification_code) { line(y, `Verification Code: ${reqObj.verification_code}`); y += 6; }
      line(y, `Uploaded At: ${reqObj.uploaded_at ? new Date(reqObj.uploaded_at).toLocaleString() : '-'}`); y += 6;
      line(y, `Approved At: ${reqObj.approved_at ? new Date(reqObj.approved_at).toLocaleString() : '-'}`); y += 8;

      doc.setFontSize(13); line(y, 'Semester Marks'); y += 8; doc.setFontSize(11);
      for (let i = 1; i <= 8; i++) {
        line(y, `Sem ${i}: CGPA ${reqObj[`sem${i}_cgpa`] ?? '-'} | % ${reqObj[`sem${i}_percentage`] ?? '-'}`);
        y += 6;
        if (y > 280) { doc.addPage(); y = 14; }
      }

      const blob = doc.output('blob');
      const file = new File([blob], `transcript_${reqObj.request_id}.pdf`, { type: 'application/pdf' });
      const data = new FormData();
      data.append('pdf', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://69.62.83.14:9000/api/hod/transcript-requests/${reqObj.request_id}/upload-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');
      const url = json.pdfUrl || json.data?.transcript_url;
      if (url) {
        setRequests(prev => prev.map(r => r.request_id === reqObj.request_id ? { ...r, transcript_url: url } : r));
        setSelectedReq(prev => prev ? { ...prev, transcript_url: url } : prev);
      }
    } catch (e) {
      setError(e.message || 'Failed to generate/upload PDF. Ensure jspdf is installed (npm i jspdf).');
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Transcript Requests</h2>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500">No transcript requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Student ERP</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Course</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => (
                <tr key={req.request_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{req.studenterpid}</td>
                  <td className="px-4 py-2">{req.firstname} {req.lastname}</td>
                  <td className="px-4 py-2">{req.course}</td>
                  <td className="px-4 py-2">{req.emailaddress}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${req.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {req.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedReq(req)}
                      className="px-3 py-1 rounded text-sm border border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Details
                    </button>
                    <button
                      disabled={approving[req.request_id] || req.status === "approved"}
                      onClick={() => approveRequest(req.request_id)}
                      className={`px-3 py-1 rounded text-sm text-white ${req.status === "approved" ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      {approving[req.request_id] ? "Approving..." : req.status === "approved" ? "Approved" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Transcript Request Details #{selectedReq.request_id}
              </h3>
              <button onClick={() => setSelectedReq(null)} className="text-gray-600 hover:text-black">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-600">Student ERP:</span> {selectedReq.studenterpid}</div>
              <div><span className="text-gray-600">Name:</span> {selectedReq.firstname} {selectedReq.lastname}</div>
              <div><span className="text-gray-600">PRN:</span> {selectedReq.prnno}</div>
              <div><span className="text-gray-600">Course:</span> {selectedReq.course}</div>
              <div><span className="text-gray-600">Email:</span> {selectedReq.emailaddress}</div>
              <div><span className="text-gray-600">Status:</span> {selectedReq.status}</div>
              <div><span className="text-gray-600">Uploaded At:</span> {selectedReq.uploaded_at ? new Date(selectedReq.uploaded_at).toLocaleString() : '-'}</div>
              <div><span className="text-gray-600">Approved At:</span> {selectedReq.approved_at ? new Date(selectedReq.approved_at).toLocaleString() : '-'}</div>
              <div><span className="text-gray-600">Fee Status:</span> {selectedReq.feestatus || '-'}</div>
              <div>
                <a href={selectedReq.fileurl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View Uploaded File
                </a>
              </div>
            </div>

            {/* Marks (always visible) */}
            <div className="mb-4">
              <h4 className="font-medium text-black mb-2">Semester Marks</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} className="text-sm bg-gray-50 border rounded p-2">
                    <div className="font-semibold">Sem {i}</div>
                    <div>CGPA: {selectedReq[`sem${i}_cgpa`] ?? '-'}</div>
                    <div>%: {selectedReq[`sem${i}_percentage`] ?? '-'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification info (only after approval) */}
            {selectedReq.status === "approved" && selectedReq.verification_code && selectedReq.random_code && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium mb-1">Verification Info</h4>
                <p><strong>Verification Code:</strong> {selectedReq.verification_code} || "no code"</p>
                <p><strong>Random Code:</strong> {selectedReq.random_code}</p>
                <p>
                  <strong>Verification URL:</strong>{" "}
                  <a href={`/verify/${selectedReq.random_code}`} className="text-blue-600 hover:underline">
                    /verify/{selectedReq.random_code}
                  </a>
                </p>
              </div>
            )}

            {/* Final transcript link (if available) */}
            {selectedReq?.transcript_url && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Final Transcript:</strong>{" "}
                  <a href={selectedReq.transcript_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View PDF</a>
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSelectedReq(null)} className="px-4 py-2 rounded border">Close</button>
              <button
                disabled={approving[selectedReq.request_id] || selectedReq.status === "approved"}
                onClick={() => approveRequest(selectedReq.request_id)}
                className={`px-4 py-2 rounded text-white ${selectedReq.status === "approved" ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
              >
                {approving[selectedReq.request_id] ? "Approving..." : selectedReq.status === "approved" ? "Approved" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptRequests;