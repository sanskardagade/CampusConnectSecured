import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiOutlineSave } from 'react-icons/ai'
import axios from 'axios'

const FacultyProfileEdit = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    facultyId: '',
    department: '',
    email: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updateError, setUpdateError] = useState(null)

  useEffect(() => {
    const fetchFacultyProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        console.log('Fetching faculty profile...')
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

        console.log('Profile data received:', response.data)
        if (response.data) {
          setFormData({
            name: response.data.name || '',
            facultyId: response.data.erpStaffId || '',
            department: response.data.department || '',
            email: response.data.email || ''
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching faculty profile:', error)
        setError(error.response?.data?.message || 'Error fetching profile data')
        setLoading(false)
      }
    }

    fetchFacultyProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setUpdateError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUpdateError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      if (!formData.email) {
        setUpdateError('Email is required')
        return
      }

      console.log('Submitting update with data:', { email: formData.email })
      const response = await axios.put(
        'http://82.112.238.4:9000/api/faculty/profile',
        { email: formData.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Profile updated successfully:', response.data)
      alert('Profile updated successfully!')
      navigate('/faculty/faculty-profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Error updating profile'
      setUpdateError(errorMessage)
    }
  }

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

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
      <div className="max-w-xl w-full mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-md border border-[#d1a550] min-h-[60vh] flex flex-col justify-center">
        <h1 className="text-xl sm:text-2xl font-bold text-[#b22b2f] mb-4 sm:mb-6 text-center">Edit Faculty Profile</h1>
        
        {updateError && (
          <div className="mb-4 p-3 bg-[#b22b2f] border border-[#d1a550] text-white rounded text-sm sm:text-base">
            {updateError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <InputField 
            label="Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            readOnly={true}
            tooltip="Name cannot be changed"
          />
          <InputField 
            label="Faculty ID" 
            name="facultyId" 
            value={formData.facultyId} 
            onChange={handleChange} 
            readOnly={true}
            tooltip="Faculty ID cannot be changed"
          />
          <InputField 
            label="Department" 
            name="department" 
            value={formData.department} 
            onChange={handleChange} 
            readOnly={true}
            tooltip="Department cannot be changed"
          />
          <InputField 
            label="Email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange}
            type="email"
            required
          />

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#d1a550] text-[#b22b2f] py-2 sm:py-2.5 rounded-lg hover:bg-[#b22b2f] hover:text-[#d1a550] transition transform hover:scale-105 text-base sm:text-lg mt-2"
          >
            <AiOutlineSave />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}

const InputField = ({ label, name, value, onChange, readOnly = false, type = "text", tooltip, required = false }) => (
  <div className="relative group">
    <label htmlFor={name} className="block text-[#d1a550] font-medium mb-1 text-sm sm:text-base">
      {label}
      {required && <span className="text-[#b22b2f] ml-1">*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      className={`w-full px-3 sm:px-4 py-2 border rounded-lg shadow-sm text-sm sm:text-base ${
        readOnly ? 'bg-[#6b6d71] cursor-not-allowed text-white' : 'focus:outline-none focus:ring-2 focus:ring-[#d1a550] border-[#d1a550] text-[#b22b2f]'
      }`}
    />
    {readOnly && tooltip && (
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#6b6d71] text-white px-2 py-1 rounded text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {tooltip}
      </div>
    )}
  </div>
)

export default FacultyProfileEdit
