import { NavLink } from "react-router-dom";
import { FaBars, FaHome, FaUser } from "react-icons/fa";
import { BiAnalyse, BiSearch } from "react-icons/bi";
import {
  AiOutlineSetting,
  AiFillDatabase,
  AiOutlinePlus,
  AiFillEye,
  AiOutlineLogout,
  AiFillBell,
  AiTwotoneFileExclamation,
  AiOutlineFilePdf,
} from "react-icons/ai";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarMenu from "./SideBarMenu";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/use-mobile";
import { FiActivity } from "react-icons/fi";

const routes = [
  {
    path: "/registrar",
    name: "Dashboard",
    icon: <FaHome />,
  },
  {
    path: "/registrar/faculty-management",
    name: "Faculty Management",
    icon: <AiOutlinePlus />,
  },
  {
    path: "/registrar/staff-management",
    name: "Staff Management",
    icon: <AiFillDatabase />,
  },
  {
    path: "/registrar/leave-applications",
    name: "Leave Applications",
    icon: <AiFillBell />,
  },
  {
    path: "/registrar/faculty-reports",
    name: "Faculty Reports",
    icon: <AiOutlineFilePdf />,
  },
  {
    path: "/registrar/energy-dashboard",
    name: "Energy Dashboard",
    icon: <BiAnalyse />,
  },
  
  
  {
    path: "/registrar/registrar-profile",
    name: "Profile",
    icon: <FaUser />,
  },
  {
    path: "/registrar/registrar-settings",
    name: "Settings",
    icon: <AiOutlineSetting />,
    subRoutes: [
      {
        path: "/registrar/registrar-settings/edit-profile",
        name: "Edit Profile",
        icon: <AiFillDatabase />,
      },
      {
        path: "/registrar/registrar-settings/change-password",
        name: "Change Password",
        icon: <AiFillEye />,
      },
    ],
  },
  { path: "/", name: "Logout", icon: <AiOutlineLogout /> },
];

// Mobile bottom tab bar component
function MobileBottomTabs({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { path: "/registrar", label: "Dashboard", icon: <FaHome /> },
    { path: "/registrar/faculty-management", label: "Faculty", icon: <AiOutlinePlus /> },
    { path: "/registrar/staff-management", label: "Staff", icon: <AiFillDatabase /> },
    { path: "/registrar/leave-applications", label: "Leaves", icon: <AiFillBell /> },
    { path: "/registrar/registrar-settings", label: "Settings", icon: <AiOutlineSetting /> },
    { path: "/", label: "Logout", icon: <AiOutlineLogout />, isLogout: true },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#b22b2f] text-white flex justify-between items-center px-1 py-1 shadow-t border-t border-[#a02529]">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => {
            if (tab.isLogout) {
              onLogout();
            } else {
              navigate(tab.path);
            }
          }}
          className={`flex flex-col items-center flex-1 px-1 py-1 focus:outline-none ${location.pathname === tab.path ? 'text-[#d1a550]' : ''}`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-[10px] leading-none">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

const RegistrarSideBar = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  // Sidebar should always be open
  const isOpen = true;

  const inputAnimation = {
    hidden: { width: 0, padding: 0, transition: { duration: 0.2 } },
    show: {
      width: "140px",
      padding: "5px 15px",
      transition: { duration: 0.2 },
    },
  };

  const showAnimation = {
    hidden: { width: 0, opacity: 0, transition: { duration: 0.3 } },
    show: {
      opacity: 1,
      width: "auto",
      transition: { duration: 0.3 },
    },
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setShowLogoutModal(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (isMobile) {
    return (
      <div className="w-screen min-h-screen bg-gray-100 pb-14">
        <main className="flex-1 p-2 sm:p-4 overflow-auto">{children}</main>
        <MobileBottomTabs onLogout={handleLogout} />
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-[#d1a550]">Confirm Logout</h3>
              <p className="text-[#b22b2f] mb-6">Are you sure you want to logout?</p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelLogout}
                  className="flex-1 bg-[#6b6d71] text-white px-4 py-2 rounded-lg hover:bg-[#b22b2f] hover:text-[#d1a550] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-[#b22b2f] text-white px-4 py-2 rounded-lg hover:bg-[#d1a550] hover:text-[#b22b2f] transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <motion.div
        animate={{
          width: "200px",
          transition: { duration: 0.5, type: "spring", damping: 10 },
        }}
        className="bg-[#b22b2f] text-white h-full overflow-y-auto shadow-lg"
      >
        <div className="flex items-center justify-between p-3">
          <AnimatePresence>
            {isOpen && (
              <motion.h1
                variants={showAnimation}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="text-lg font-bold"
              >
                CampusConnect
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-col">
            {routes.map((route, index) => {
              if (route.subRoutes) {
                return (
                  <SidebarMenu
                    route={route}
                    showAnimation={showAnimation}
                    isOpen={isOpen}
                    key={index}
                  />
                );
              }

              // Handle logout as a special case
              if (route.name === 'Logout') {
                return (
                  <button
                    key={index}
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#d1a550] transition w-full text-left"
                  >
                    <div className="text-xl">{route.icon}</div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          variants={showAnimation}
                          initial="hidden"
                          animate="show"
                          exit="hidden"
                          className="text-sm"
                        >
                          {route.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              }

              return (
                <NavLink
                  to={route.path}
                  key={index}
                  className={({ isActive }) =>
                    `link ${isActive ? "active" : ""}`
                  }
                >
                  <div className="icon">{route.icon}</div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        variants={showAnimation}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className="link_text"
                      >
                        {route.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-auto">
        <main className="flex-1 p-2 sm:p-4 overflow-auto">{children}</main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[#d1a550]">Confirm Logout</h3>
            <p className="text-[#b22b2f] mb-6">Are you sure you want to logout?</p>
            <div className="flex space-x-4">
              <button
                onClick={cancelLogout}
                className="flex-1 bg-[#6b6d71] text-white px-4 py-2 rounded-lg hover:bg-[#b22b2f] hover:text-[#d1a550] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-[#b22b2f] text-white px-4 py-2 rounded-lg hover:bg-[#d1a550] hover:text-[#b22b2f] transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarSideBar; 