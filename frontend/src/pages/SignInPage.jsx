import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { FiLogIn, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaCheckCircle, FaChalkboardTeacher, FaUsers, FaCalendarCheck } from "react-icons/fa";
import CollegeImg from "../assets/dit_image.png"; 
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useIsMobile } from "../components/hooks/use-mobile";
import HeaderCollege from "../components/common/HeaderCollege";

const SignInPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    erpstaffid: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = "http://localhost:5000/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });


      const data = await response.json();
      console.log("Login response data:", data); // Debugging line
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Normalize user data to handle backend inconsistencies
      const normalizedUser = {
        ...data.user,
        erpStaffId: data.user.erpStaffId || data.user.erpid, // Handle both cases
        departmentId: data.user.departmentId || data.user.department_id
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("role", normalizedUser.role);
      updateUser(normalizedUser);

      const rolePath = {
        'student': '/student',
        'faculty': '/faculty',
        'hod': '/hod',
        'principal': '/principal',
        'registrar': '/registrar'
      };

      navigate(rolePath[normalizedUser.role] || '/');
    } catch (err) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeaderCollege />
      <Navbar />
      <div className={`flex min-h-screen font-sans bg-gradient-to-br from-white to-red-50`}>
        {/* Left Section - Image + Heading (hidden on mobile) */}
        {!isMobile && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative md:w-1/2 h-[500px] md:h-auto"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${CollegeImg})` }}
            ></div>
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 text-white p-10 h-full flex flex-col justify-center items-start">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-sm mx-auto">
                <h1 className="text-4xl font-extrabold mb-4">Welcome to CampusConnect</h1>
                <p className="text-md text-gray-200 mb-6">
                  CampusConnect is your all-in-one platform for academic collaboration and campus life.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaCalendarCheck className="text-green-400 text-xl" />
                    <span>Real-time attendance & leave management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaUsers className="text-blue-300 text-xl" />
                    <span>Role-based dashboards & features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-yellow-300 text-xl" />
                    <span>Stress tracking and well-being</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaChalkboardTeacher className="text-pink-300 text-xl" />
                    <span>Events, circulars & announcements</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Right Section - Login Form */}
        <div className={`w-full flex justify-center items-center py-12 px-4 min-h-screen`}>
          <div className="border-2 border-red-700 rounded-2xl p-8 w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-lg">
            <h2 className="text-center text-3xl font-bold mb-7 text-red-800 tracking-tight">Sign In</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <FiAlertCircle className="mr-2" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="p-3 text-base border rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="hod">HOD</option>
                <option value="principal">Principal</option>
                <option value="registrar">Registrar</option>
              </select>
              <input
                type="text"
                name="erpstaffid"
                placeholder={formData.role === 'student' ? "ERP ID" : "ERP Staff ID"}
                value={formData.erpstaffid}
                onChange={handleChange}
                required
                className="p-3 text-base border rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="p-3 text-base border rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
              />
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="remember" className="accent-red-600" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-800 text-white p-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-900 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiLogIn />
                    Login
                  </>
                )}
              </button>
            </form>
            <p className="text-right text-sm mt-4">
              <a href="#" className="text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignInPage;
