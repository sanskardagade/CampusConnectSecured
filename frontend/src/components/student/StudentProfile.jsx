import React from 'react'
import { useState, useEffect } from 'react'
import {useNavigate} from 'react-router-dom'
import {FaUserCircle, FaIdCard, FaEnvelope, FaGraduationCap, FaCalendarAlt, FaLayerGroup, FaHashtag, FaBuilding} from 'react-icons/fa'
import axios from 'axios'
import {useIsMobile} from '../hooks/use-mobile'

const StudentProfile = () => {
  const navigate = useNavigate();
  const [student,setStudent] = useState(null);
  const [loading , setLoading]  = useState(true);
  const[error, setError] = useState(null);
  const isMobile = useIsMobile();

  
    useEffect(() =>{
      const fetchstudentProfile = async () =>{
      try{
        const token = localStorage.getItem('token')
        if(!token){
          throw new Error('No authentication token found')
        }
         console.log('Fetching Principal profile...')
        console.log('Token:', token) // Debug token
        const today = new Date().toISOString().slice(0,10);
        
        const response = await axios.get(
          `http://localhost:5000/api/students/profile`,
          {
            headers:{
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log('Student Profile data:', response.data) 

        if(!response.data){
          throw new Error('No student data found')
        }

        setStudent(response.data.data);
        setLoading(false);
  
    }catch(error){
      console.error('Error fetching student profile:', error);
      console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        setError(error.response?.message || 'An error occurred while fetching student profile');
        setLoading(false);
    }
    }
    fetchstudentProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-gray-200">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-24 h-24 rounded-full mb-4" style={{backgroundColor: '#d1a550'}}></div>
            <div className="h-6 rounded w-3/4 mb-2" style={{backgroundColor: '#6b6d71'}}></div>
            <div className="h-4 rounded w-1/2" style={{backgroundColor: '#d1a550'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#b22b2f'}}>
              <FaUserCircle className="text-3xl text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{color: '#b22b2f'}}>Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{backgroundColor: '#b22b2f'}}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  if(!student){
     return (
       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center border border-gray-200">
           <FaUserCircle className="text-6xl mx-auto mb-4" style={{color: '#6b6d71'}} />
           <h2 className="text-xl font-bold mb-2" style={{color: '#b22b2f'}}>No Profile Found</h2>
           <p style={{color: '#6b6d71'}}>Student profile data is not available</p>
         </div>
       </div>
     )
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
      {isMobile && (
        <div className="block sm:hidden w-full text-white text-lg font-bold py-4 px-6 shadow-lg" style={{background: 'linear-gradient(90deg, #b22b2f 0%, #9a252a 100%)'}}>
          <div className="flex items-center">
            <FaUserCircle className="mr-3" />
            Profile
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8" style={{border: '1px solid #d1a550'}}>
            <div className="px-8 py-12 text-center relative" style={{background: 'linear-gradient(135deg, #b22b2f 0%, #9a252a 100%)'}}>
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="relative z-10">
                <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border-2" style={{backgroundColor: 'rgba(209, 165, 80, 0.2)', borderColor: '#d1a550'}}>
                  <FaUserCircle className="text-6xl" style={{color: '#d1a550'}} />
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{student.name || 'Student'}</h1>
                <p className="text-lg mb-4" style={{color: '#d1a550'}}>{student.erpid || 'Student ID'}</p>
                <div className="inline-block backdrop-blur-sm rounded-full px-4 py-2" style={{backgroundColor: 'rgba(209, 165, 80, 0.2)', border: '1px solid #d1a550'}}>
                  <span className="font-medium" style={{color: '#d1a550'}}>{student.departmentName || `Dept ID: ${student.departmentId}`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{border: '1px solid #d1a550'}}>
              <div className="px-6 py-4" style={{background: 'linear-gradient(135deg, #b22b2f 0%, #9a252a 100%)'}}>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FaIdCard className="mr-3" style={{color: '#d1a550'}} />
                  Personal Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <ProfileField icon={FaUserCircle} label="Full Name" value={student.name} />
                <ProfileField icon={FaIdCard} label="Student ID" value={student.erpid} />
                <ProfileField icon={FaEnvelope} label="Email" value={student.email} />
                <ProfileField icon={FaHashtag} label="Roll Number" value={student.rollNo} />
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{border: '1px solid #d1a550'}}>
              <div className="px-6 py-4" style={{background: 'linear-gradient(135deg, #b22b2f 0%, #9a252a 100%)'}}>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FaGraduationCap className="mr-3" style={{color: '#d1a550'}} />
                  Academic Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <ProfileField icon={FaBuilding} label="Department" value={student.departmentName || `Dept ID: ${student.departmentId}`} />
                <ProfileField icon={FaCalendarAlt} label="Year" value={student.year} />
                <ProfileField icon={FaLayerGroup} label="Semester" value={student.semester} />
                <ProfileField icon={FaGraduationCap} label="Division" value={student.division} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
 
};
    
// Reusable field component
const ProfileField = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border" 
       style={{
         backgroundColor: 'rgba(209, 165, 80, 0.08)',
         borderColor: '#d1a550',
         borderWidth: '1px'
       }}>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
           style={{backgroundColor: 'rgba(178, 43, 47, 0.1)'}}>
        <Icon className="text-lg" style={{color: '#b22b2f'}} />
      </div>
      <span className="font-semibold" style={{color: '#6b6d71'}}>{label}</span>
    </div>
    <span className="font-bold text-right" style={{color: '#b22b2f'}}>{value || 'N/A'}</span>
  </div>
)

export default StudentProfile
