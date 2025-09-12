import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'
import { AiOutlineLogout } from 'react-icons/ai'
import { FaUserCircle } from 'react-icons/fa'
import axios from 'axios'
import HeaderMobile from '../common/HeaderMobile'

const AdminProfile = () => {
  const navigate = useNavigate()
  const { logout } = useUser()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        console.log('Fetching Admin profile...')
        console.log('Token:', token) // Debug token

        const response = await axios.get('http://69.62.83.14:9000/api/admin/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        console.log('Admin profile response:', response.data)
        
        if (!response.data) {
          throw new Error('No data received from server')
        }

        setAdmin(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching Admin profile:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        setError(error.response?.data?.message || 'Error fetching profile data')
        setLoading(false)
      }
    }

    fetchAdminProfile()
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

  if (!admin) {
    return <div className="p-4 text-gray-700">No profile data available</div>
  }

  return (
    <>
      <HeaderMobile title="Profile" />
      <div className="pt-16">
        <div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="flex flex-col items-center mb-6">
            <FaUserCircle className="text-[80px] text-red-700 mb-2" />
            <h1 className="text-3xl font-extrabold text-red-800">Profile</h1>
            <p className="text-gray-500">Welcome back, {admin.name || 'Admin'}!</p>
          </div>
          
          <div className="space-y-4 px-2">
            <ProfileField label="Name" value={admin.name} />
            <ProfileField label="Admin ID" value={admin.erpstaffid} />
            <ProfileField label="Email" value={admin.email} />
            {/* <ProfileField label="Start Date" value={admin.startDate} />
            <ProfileField label="End Date" value={admin.endDate || 'Current'} /> */}
            <ProfileField label="Status" value={admin.isActive ? 'Active' : 'Inactive'} />
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

export default AdminProfile
