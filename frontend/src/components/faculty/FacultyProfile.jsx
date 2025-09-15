import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { AiOutlineLogout } from 'react-icons/ai'
import { FaUserCircle } from 'react-icons/fa'
import axios from 'axios'
import { useIsMobile } from '../hooks/use-mobile'

const FacultyProfile = () => {
  const navigate = useNavigate()
  const { logout } = useUser()
  const [faculty, setFaculty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useIsMobile()

  const handleLogout = () => {
    try {
      logout()
      localStorage.clear()
      navigate('/signin', { replace: true })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    const fetchFacultyProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        console.log('Fetching faculty profile...')
        console.log('Token:', token) // Debug token

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().slice(0, 10);

        const response = await axios.get(
          `http://82.112.238.4:9000/api/faculty/dashboard?date=${today}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log('Faculty profile response:', response.data)
        
        if (!response.data) {
          throw new Error('No data received from server')
        }

        setFaculty(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching faculty profile:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        setError(error.response?.data?.message || 'Error fetching profile data')
        setLoading(false)
      }
    }

    fetchFacultyProfile()
  }, [])

  if (loading) {
    return <div className="p-4 text-gray-700 animate-pulse">Loading profile...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!faculty) {
    return <div className="p-4 text-gray-700">No profile data available</div>
  }

  return (
    <>
      {isMobile && (
        <div className="block sm:hidden w-full bg-red-700 text-white text-lg font-bold py-3 px-4 shadow">Profile</div>
      )}
      <div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-red-100">
        <div className="flex flex-col items-center mb-6">
          <FaUserCircle className="text-[80px] text-red-700 mb-2" />
          <h1 className="text-3xl font-extrabold text-red-800">Faculty Profile</h1>
          <p className="text-gray-500">Welcome back, {faculty.name || 'Faculty'}!</p>
        </div>

        <div className="space-y-4 px-2">
          <ProfileField label="Name" value={faculty.name} />
          <ProfileField label="Faculty ID" value={faculty.erpStaffId} />
          <ProfileField label="Department" value={faculty.department} />
          <ProfileField label="Email" value={faculty.email} />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <AiOutlineLogout className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

// Reusable field component
const ProfileField = ({ label, value }) => (
  <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg shadow-sm hover:shadow-md transition">
    <span className="font-medium text-red-900">{label}:</span>
    <span className="text-gray-900 font-semibold">{value || 'N/A'}</span>
  </div>
)

export default FacultyProfile
