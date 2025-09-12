import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import { Link as ScrollLink } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import { FiLogIn, FiAlertCircle } from "react-icons/fi";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [showCollegeSelect, setShowCollegeSelect] = useState(false);
  const colleges = ["Dr. D. Y. Patil Inst. of Tech., Pimpri", "IMR",  "B-School"];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => { 
    const handleClickOutside = (event) => {
      if (mobileOpen && !event.target.closest("nav")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const navLinks = [
    { id: "features", label: "Features" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact", to: "/contact" }
  ];

  const userMenuItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Profile", to: "/profile" },
    { label: "Settings", to: "/settings" },
    { label: "Logout", to: "/logout" }
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "top-0 bg-[#b22b2f] shadow-xl" : "top-24 bg-[#b22b2f]"}`}>
      <div className="w-full px-2">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center"
          >
            <Link to="/" className="text-2xl font-bold text-white flex items-center">
              <span className="text-[#d1a550]">
                CampusConnect
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.id === "contact" ? (
                <Link
                  key={link.id}
                  to={link.to}
                  className={
                    `relative px-3 py-2 text-sm font-medium cursor-pointer transition-colors text-white rounded-lg`
                  }
                  onClick={() => setActiveLink(link.id)}
                >
                  {link.label}
                  {activeLink === link.id && (
                    <motion.span 
                      layoutId="navUnderline"
                      className="absolute left-0 bottom-0 w-full h-0.5 bg-[#d1a550]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ) : (
                <ScrollLink
                  key={link.id}
                  to={link.id}
                  smooth={true}
                  offset={-80}
                  duration={500}
                  spy={true}
                  onSetActive={() => setActiveLink(link.id)}
                  className={
                    `relative px-3 py-2 text-sm font-medium cursor-pointer transition-colors text-white rounded-lg`
                  }
                >
                  {link.label}
                  {activeLink === link.id && (
                    <motion.span 
                      layoutId="navUnderline"
                      className="absolute left-0 bottom-0 w-full h-0.5 bg-[#d1a550]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </ScrollLink>
              )
            ))}
            {/* Admin Quick Login Button */}
            <button
              className="ml-4 text-sm text-white bg-[#d1a550] px-4 py-2 rounded-lg hover:bg-[#c19a45] transition flex items-center gap-2"
              onClick={() => navigate('/admin-login')}
              type="button"
            >
              <FiLogIn /> Admin Quick Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#b22b2f] focus:outline-none transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* College Selection Modal */}
      {showCollegeSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-[#6b6d71] hover:text-[#6b6d71]"
              onClick={() => setShowCollegeSelect(false)}
            >
              <FaTimes className="h-5 w-5" />
            </button>
            <h2 className="text-center text-2xl mb-5">Select College</h2>
            <div className="flex flex-col gap-3">
              {colleges.map((college) => (
                college === "Dr. D. Y. Patil Inst. of Tech., Pimpri" ? (
                  <button
                    key={college}
                    className="bg-[#b22b2f] text-white p-3 rounded-md hover:bg-[#d1a550] transition-colors"
                    onClick={() => {
                      setShowCollegeSelect(false);
                      localStorage.setItem("selectedCollege", college);
                      navigate(`/admin?college=${college}`);
                    }}
                  >
                    {college}
                  </button>
                ) : (
                  <button
                    key={college}
                    className="bg-gray-300 text-gray-600 p-3 rounded-md cursor-not-allowed flex justify-between items-center"
                    disabled
                  >
                    <span>{college}</span>
                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
                  </button>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#b22b2f] overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                link.id === "contact" ? (
                  <Link
                    key={link.id}
                    to={link.to}
                    className={`block px-3 py-2 rounded-lg text-base font-medium text-white`}
                    onClick={() => { setActiveLink(link.id); setMobileOpen(false); }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <ScrollLink
                    key={link.id}
                    to={link.id}
                    smooth={true}
                    offset={-80}
                    duration={500}
                    spy={true}
                    onSetActive={() => setActiveLink(link.id)}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-base font-medium text-white`}
                  >
                    {link.label}
                  </ScrollLink>
                )
              ))}
              {/* Admin Quick Login Button for Mobile */}
              <button
                className="w-full mt-2 text-sm text-white bg-[#d1a550] px-4 py-2 rounded-lg hover:bg-[#c19a45] transition flex items-center gap-2 justify-center"
                onClick={() => { navigate('/admin-login'); setMobileOpen(false); }}
                type="button"
              >
                <FiLogIn /> Admin Quick Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
