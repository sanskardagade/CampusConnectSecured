import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const AdminChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const toggleVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://69.62.83.14:9000/api/admin/change-password',
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Error changing password');
    }
  };

  const renderInput = (label, name, showField) => (
    <div className="mb-4 relative">
      <label className="block text-sm font-semibold mb-1 text-[#d1a550]">{label}</label>
      <input
        type={showPassword[showField] ? 'text' : 'password'}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={label}
        className="w-full px-4 py-2 rounded bg-white text-[#b22b2f] border border-[#d1a550] focus:outline-none focus:ring-2 focus:ring-[#d1a550]"
      />
      <button
        type="button"
        className="absolute top-8 right-3 text-[#b22b2f]"
        onClick={() => toggleVisibility(showField)}
      >
        {showPassword[showField] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#b22b2f] p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#d1a550]">Change Admin Password</h2>
        <form onSubmit={handleSubmit}>
          {renderInput('Current Password', 'currentPassword', 'current')}
          {renderInput('New Password', 'newPassword', 'new')}
          {renderInput('Confirm New Password', 'confirmPassword', 'confirm')}
          <button
            type="submit"
            className="w-full bg-[#d1a550] text-[#b22b2f] font-semibold py-2 rounded hover:bg-[#b22b2f] hover:text-[#d1a550] transition duration-300"
          >
            Change Password
          </button>
          {error && <p className="mt-4 text-sm text-[#b22b2f]">{error}</p>}
          {message && <p className="mt-4 text-sm text-[#d1a550]">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AdminChangePassword;
