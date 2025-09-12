import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaLock, FaArrowRight } from 'react-icons/fa';

const RegistrarSettings = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-red-100 mt-2">Manage your account settings and preferences</p>
          </div>

          {/* Settings Options */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Edit Profile */}
              <Link
                to="/registrar/registrar-settings/edit-profile"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 hover:border-red-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <FaUser className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Edit Profile</h3>
                      <p className="text-gray-600">Update your personal information</p>
                    </div>
                  </div>
                  <FaArrowRight className="text-gray-400" />
                </div>
              </Link>

              {/* Change Password */}
              <Link
                to="/registrar/registrar-settings/change-password"
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 hover:border-red-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <FaLock className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                      <p className="text-gray-600">Update your account password</p>
                    </div>
                  </div>
                  <FaArrowRight className="text-gray-400" />
                </div>
              </Link>
            </div>

            {/* Information Section */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Account Information</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• Your account settings are secure and encrypted</p>
                <p>• Changes to your profile will be reflected immediately</p>
                <p>• Password changes require your current password for verification</p>
                <p>• Contact the administrator for any account-related issues</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarSettings; 