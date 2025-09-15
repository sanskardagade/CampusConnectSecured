import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const TranscriptVerification = () => {
  const { randomcode } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(
          `http://82.112.238.4:9000/api/auth/verify/${randomcode}`
        );
        const transcript = res.data.result && res.data.result.length > 0 ? res.data.result[0] : null;
        console.log(transcript);
        setDetails(transcript);
        setLoading(false);
      } catch (err) {
        setError("Invalid or expired verification code.");
        setLoading(false);
      }
    };
    fetchDetails();
  }, [randomcode]);

  const handleVerification = () => {
    if (!details) return;
    
    if (verificationCode.trim() === details.verification_code) {
      setIsVerified(true);
      setVerificationError("");
    } else {
      setVerificationError("Invalid verification code. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerification();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-600 text-center p-4">{error}</div>;
  if (!details) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Transcript Verification</h2>
      
      {/* Always show name */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <p>
          <strong>Name:</strong> {details.firstname} {details.lastname}
        </p>
      </div>

      {!isVerified ? (
        <div style={{ marginBottom: '20px' }}>
          <h3>Enter Verification Code</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter verification code"
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px'
              }}
            />
            <button
              onClick={handleVerification}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Verify
            </button>
          </div>
          {verificationError && (
            <div style={{ color: "red", fontSize: '14px' }}>{verificationError}</div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ color: 'green', marginBottom: '20px', fontWeight: 'bold' }}>
            ✓ Verification Successful
          </div>
          
          {/* Personal Information */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <p><strong>ERP ID:</strong> {details.studenterpid}</p>
              <p><strong>PRN Number:</strong> {details.prnno}</p>
              <p><strong>Email:</strong> {details.emailaddress}</p>
              <p><strong>Mobile:</strong> {details.mobno}</p>
              <p><strong>Gender:</strong> {details.gender}</p>
              <p><strong>Date of Birth:</strong> {new Date(details.dob).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Academic Information */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Academic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <p><strong>Course:</strong> {details.course}</p>
              <p><strong>Year of Joining:</strong> {details.yearofjoin}</p>
              <p><strong>Year of Passing:</strong> {details.yearofpass}</p>
              <p><strong>Status:</strong> <span style={{ color: details.status === 'approved' ? 'green' : 'orange' }}>{details.status}</span></p>
              <p><strong>Fee Status:</strong> <span style={{ color: details.feestatus === 'paid' ? 'green' : 'red' }}>{details.feestatus}</span></p>
            </div>
          </div>

          {/* Semester Results */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Semester Results</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '14px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                details[`sem${sem}_cgpa`] && (
                  <div key={sem} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <strong>Sem {sem}</strong><br />
                    CGPA: {details[`sem${sem}_cgpa`]}<br />
                    %: {details[`sem${sem}_percentage`]}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Document Information */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Document Information</h3>
            <p><strong>Request ID:</strong> {details.request_id}</p>
            <p><strong>Transcript ID:</strong> {details.transcript_id}</p>
            <p><strong>Random Code:</strong> {details.random_code}</p>
            <p><strong>Verification Code:</strong> {details.verification_code}</p>
            <p><strong>Uploaded At:</strong> {new Date(details.uploaded_at).toLocaleString()}</p>
            <p><strong>Approved At:</strong> {new Date(details.approved_at).toLocaleString()}</p>
            {details.fileurl && (
              <p>
                <strong>Document:</strong> 
                <a 
                  href={details.fileurl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ marginLeft: '10px', color: '#007bff' }}
                >
                  View Transcript
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptVerification;