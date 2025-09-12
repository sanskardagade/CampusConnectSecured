import React from 'react';
import { Users, Calendar, Brain, Bell, BarChart, FileText, Star, Award, Zap, Leaf, UserCheck } from 'lucide-react';

const Features = () => {
  const featuresList = [
    {
      icon: <Users size={40} />,
      title: "CCTV Face Recognition Attendance",
      description: "Automated attendance tracking using AI-powered face recognition through existing CCTV infrastructure, eliminating manual roll calls and reducing administrative burden."
    },
    {
      icon: <Calendar size={40} />,
      title: "Student Tracking",
      description: "Comprehensive tracking system for monitoring student activities, academic progress, and campus presence to enhance security and provide valuable insights to educators."
    },
    {
      icon: <UserCheck size={40} />,
      title: "Faculty Tracking",
      description: "Monitor faculty attendance, schedules, and engagement to ensure optimal resource allocation and academic quality."
    },
    {
      icon: <Brain size={40} />,
      title: "Stress Management",
      description: "Mental wellness tools and resources to help manage stress for all campus members, including mood tracking, meditation resources, and direct counselor connections."
    },
    {
      icon: <Bell size={40} />,
      title: "Real-Time Notifications",
      description: "Instant notifications after attendance taken to both faculty and students. "
    },
    {
      icon: <Leaf size={40} />,
      title: "Energy Management",
      description: "Smart monitoring and optimization of campus energy usage to promote sustainability and reduce operational costs."
    },
    {
      icon: <BarChart size={40} />,
      title: "Performance Analytics",
      description: "Data-driven insights on academic performance with visual representations of progress and improvement areas."
    },
    {
      icon: <FileText size={40} />,
      title: "Faculty Leave Request",
      description: "Streamlined digital process for faculty to submit, track, and manage leave requests efficiently."
    }
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-700 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-red-800 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              <Zap size={16} className="inline mr-2" />
              Explore our features
            </div>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-red-900 via-red-800 to-red-700 bg-clip-text text-transparent">
            Campus Connect Features
          </h2>
          <p className="text-xl text-[#6b6d71] max-w-3xl mx-auto leading-relaxed">
            Transforming campus management with cutting-edge technology and student-centered solutions
          </p>
        </div>
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuresList.map((feature, index) => (
            <div 
              key={index}
              className="group relative"
            >
              {/* Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full border-l-4 border-[#b22b2f] relative overflow-hidden transition-all duration-500">
                {/* Icon container */}
                <div className="mb-6 p-4 rounded-xl inline-block bg-gradient-to-br from-red-100 to-red-50">
                  <div className="text-[#b22b2f]">
                    {feature.icon}
                  </div>
                </div>
                {/* Content */}
                <h3 className="text-xl font-bold mb-4 text-[#b22b2f]">
                  {feature.title}
                </h3>
                <p className="text-[#6b6d71] mb-4 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;


// import React from 'react';
// import { Users, Calendar, Brain, Bell, Book, ChartBar, MessageSquare, FileText } from 'lucide-react';
// import Footer from '../components/common/Footer';
// import Navbar from '../components/common/Navbar';

// const Features = () => {
//   const featuresList = [
//     {
//       icon: <Users size={40} />,
//       title: "CCTV Face Recognition Attendance",
//       description: "Automated attendance tracking using AI-powered face recognition through existing CCTV infrastructure, eliminating manual roll calls and reducing administrative burden."
//     },
//     {
//       icon: <Calendar size={40} />,
//       title: "Student Tracking",
//       description: "Comprehensive tracking system for monitoring student activities, academic progress, and campus presence to enhance security and provide valuable insights to educators."
//     },
//     {
//       icon: <Brain size={40} />,
//       title: "Student Stress Management",
//       description: "Mental wellness tools and resources to help students manage academic stress, including mood tracking, meditation resources, and direct counselor connections."
//     },
//     {
//       icon: <Bell size={40} />,
//       title: "Real-Time Notifications",
//       description: "Instant alerts for important campus announcements, emergency notifications, and personalized academic updates."
//     },
//     {
//       icon: <Book size={40} />,
//       title: "Course Management",
//       description: "Centralized platform for syllabus access, assignment submissions, and educational resource distribution."
//     },
//     {
//       icon: <ChartBar size={40} />,
//       title: "Performance Analytics",
//       description: "Data-driven insights on academic performance with visual representations of progress and improvement areas."
//     },
//     {
//       icon: <MessageSquare size={40} />,
//       title: "Communication Hub",
//       description: "Secure messaging system connecting students, faculty, and administrative staff for seamless communication."
//     },
//     {
//       icon: <FileText size={40} />,
//       title: "Document Management",
//       description: "Digital repository for academic documents, certificates, and important institutional paperwork."
//     }
//   ];

//   return (
//     <>
//     <Navbar/>
//     <section className="py-16 bg-gray-50">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Campus Connect Features</h2>
//           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//             Transforming campus management with cutting-edge technology and student-centered solutions
//           </p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//           {featuresList.map((feature, index) => (
//             <div 
//               key={index} 
//               className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
//             >
//               <div className="text-red-900 mb-4">
//                 {feature.icon}
//               </div>
//               <h3 className="text-xl font-semibold text-red-900 mb-3">
//                 {feature.title}
//               </h3>
//               <p className="text-gray-600">
//                 {feature.description}
//               </p>
//             </div>
//           ))}
//         </div>
        
//         <div className="mt-16 text-center">
//           <button className="bg-red-900 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-800 transition-all duration-300">
//             Explore All Features
//           </button>
//         </div>
//       </div>
//     </section>
//     <Footer/>
//     </>
//   );
// };

// export default Features;