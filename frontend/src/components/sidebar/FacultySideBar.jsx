import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaUser } from "react-icons/fa";
import { BiAnalyse, BiSearch } from "react-icons/bi";
import { TbReport } from "react-icons/tb";
import { FaTasks } from "react-icons/fa";
import { PiStudentBold } from "react-icons/pi";
import { FaBuffer } from "react-icons/fa";
import {
  AiOutlineSetting,
  AiFillDatabase,
  AiOutlinePlus,
  AiFillEye,
  AiOutlineLogout,
  AiTwotoneFileExclamation,
  AiFillContainer
} from "react-icons/ai";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarMenu from "./SideBarMenu";
import { useIsMobile } from "../hooks/use-mobile";


  const routes = [
    {
      path: "/faculty",
      name: "Dashboard",
      icon: <FaHome />,
    },
    {
      path: "/faculty/students-logs",
      name: "Students Logs",
      icon: <FaBuffer/>,
    },
    {
      path: "/faculty/leave-apply",
      name: "Leave Application",
      icon: <AiFillContainer />,
    },
    {
      path: "/faculty/add-tasks",
      name: "Task to do",
      icon: <FaTasks />,
    },
    {
      path: "/faculty/attendance-report",
      name: "Attendance Report",
      icon: <TbReport />,
    },
    {
      path: "/faculty/students",
      name: "Students",
      icon: <PiStudentBold />,
    },
    {
      path: "/faculty/faculty-profile",
      name: "Profile",
      icon: <FaUser />,
    },
    {
      path: "/faculty/faculty-settings",
      name: "Settings",
      icon: <AiOutlineSetting />,
      subRoutes: [
        {
          path: "/faculty/faculty-settings/edit-profile",
          name: "Edit Profile",
          icon: <AiFillDatabase />,
        },
        {
          path: "/faculty/faculty-settings/change-password",
          name: "Change Password",
          icon: <AiFillEye />,
        },
      ],
    },
    { path: "/", name: "Logout", icon: <AiOutlineLogout /> },
  ];
  

function MobileBottomTabsFaculty({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { path: "/faculty", label: "Dashboard", icon: <FaHome /> },
    // { path: "/faculty/student-stress-level", label: "Stress", icon: <BiAnalyse /> },
    { path: "/faculty/students-logs", label: "Students Logs", icon: <FaBuffer /> },
    { path: "/faculty/leave-apply", label: "Leaves", icon: <AiFillContainer /> },
    { path: "/faculty/faculty-profile", label: "Profile", icon: <FaUser /> },
    { path: "/faculty/faculty-settings", label: "Settings", icon: <AiOutlineSetting /> },
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

const FacultySideBar = ({ children }) => {
  const isMobile = useIsMobile();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Move handleLogout above its first use
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-gray-100 pb-14">
        <main className="flex-1 p-2 sm:p-4 overflow-auto">{children}</main>
        <MobileBottomTabsFaculty onLogout={handleLogout} />
      </div>
    );
  }
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

  const confirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setShowLogoutModal(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

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

        {/* Search box */}
        <div className="flex items-center px-2 py-2">
          <BiSearch />
          <AnimatePresence>
            {isOpen && (
              <motion.input
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={inputAnimation}
                type="text"
                placeholder="Search"
                className="ml-2 bg-[#a02529] text-white rounded px-2 py-1 outline-none w-full"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Routes */}
        <nav className="flex flex-col gap-1 px-2">
          {routes.map((route, index) => {
            if (route.subRoutes) {
              return (
                <SidebarMenu
                  key={index}
                  route={route}
                  showAnimation={showAnimation}
                  isOpen={isOpen}
                />
              );
            }

            if (route.name === 'Logout') {
              return (
                <button
                  key={index}
                  className="flex items-center gap-3 p-2 rounded hover:bg-[#d1a550] transition w-full text-left"
                  onClick={handleLogout}
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
                  `flex items-center gap-3 p-2 rounded hover:bg-[#d1a550] transition ${
                    isActive ? "bg-[#d1a550]" : ""
                  }`
                }
                onClick={() => {
                  if (location.pathname === route.path) {
                    window.location.reload();
                  }
                }}
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
              </NavLink>
            );
          })}
        </nav>
      </motion.div>

      {/* Right side content */}
      <main className="flex-1 bg-gray-100 p-4 overflow-auto">
        {children}
      </main>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Logout</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelLogout} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded bg-[#b22b2f] text-white hover:bg-[#a02529]">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySideBar;
