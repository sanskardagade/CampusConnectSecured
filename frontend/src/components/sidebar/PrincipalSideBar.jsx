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
      path: "/principal",
      name: "Dashboard",
      icon: <FaHome />,
    },
    // {
    //   path: "/principal/view-student",
    //   name: "View Student Attendance",
    //   icon: <FaUser />,
    //},
    // {
    //   path: "/principal/view-faculty",
    //   name: "View Faculty Attendance",
    //   icon: <AiOutlinePlus />,
    // },
    {
      path: "/principal/view-stress-level",
      name: "View Faculty Stress Level",
      icon: <AiTwotoneFileExclamation />,
    },
   
    
    {
      path: "/principal/faculty-leave-approval",
      name: "Faculty Leave Approval",
      icon: <AiFillBell />,
    
    },
    
    // {
    //     path: "/principal/view-student-location",
    //     name: "View Student Location",
    //     icon: <BiAnalyse />,
    //   },
    // {
    //   path: "/principal/department-statistics",
    //   name: "View Department Statistics",
    //   icon: <BiAnalyse />,
    // },
    {
      path: "/principal/faculty-report",
      name: "Faculty Attendance Report",
      icon: <AiOutlineFilePdf />,
    },
    // {
    //   path: "/principal/classroom-distribution",
    //   name: "Classroom Distribution",
    //   icon: <BiAnalyse />,
    // },
    
    {
      path: "/principal/principal-profile",
      name: "Profile",
      icon: <FaUser />,
    },
    {
      path: "/principal/principal-settings",
      name: "Settings",
      icon: <AiOutlineSetting />,
      subRoutes: [
        {
          path: "/principal/principal-settings/edit-profile",
          name: "Edit Profile",
          icon: <AiFillDatabase />,
        },
        {
          path: "/principal/principal-settings/change-password",
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
    { path: "/principal", label: "Dashboard", icon: <FaHome /> },
    { path: "/principal/faculty-leave-approval", label: "Leaves", icon: <AiFillBell /> },
    { path: "/principal/faculty-report", label: "Report", icon: <AiOutlineFilePdf /> },
    { path: "/principal/view-stress-level", label: "Stress", icon: <FiActivity /> },
    { path: "/principal/principal-settings", label: "Settings", icon: <AiOutlineSetting /> },
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

const PrincipalSideBar = ({ children }) => {
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4 text-[#b22b2f]">Confirm Logout</h2>
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

        {/* Search box */}
        {/* <div className="flex items-center px-2 py-2">
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
        </div> */}

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
            <h2 className="text-xl font-bold mb-4 text-[#b22b2f">Confirm Logout</h2>
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

export default PrincipalSideBar;
