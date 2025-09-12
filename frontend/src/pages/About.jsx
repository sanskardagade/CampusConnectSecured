import React, { Link ,useState, useEffect } from 'react';
import { GraduationCap, Users, Award, Target, Code, Lightbulb, Heart, Zap, ChevronRight, Star, BookOpen, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({ projects: 0, students: 0, satisfaction: 0 });

  // Animated counter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({ projects: 50, students: 1000, satisfaction: 98 });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const guides = [
    {
      name: "Prof. Atul Kathole",
      title: "Project Guide",
      description: "With over 15 years of experience in computer science education and research, Prof. Kathole specializes in AI and computer vision technologies. His guidance has been instrumental in developing our facial recognition attendance system.",
      expertise: ["AI & Machine Learning", "Computer Vision", "Research"]
    },
    {
      name: "Prof. Suvarna Patil",
      title: "Guide",
      description: "An expert in software engineering and database management, Prof. Patil brings valuable insights into system architecture and data security. Her mentorship ensures our platform meets the highest standards of reliability and performance.",
      expertise: ["Software Engineering", "Database Management", "System Architecture"]
    }
  ];

  const teamMembers = [
    { name: "Master Sanskar Dagade", role: "Team Lead & Full-Stack Developer", avatar: "👨‍💻", color: "from-blue-500 to-purple-600" },
    { name: "Master Deepak Zamnani", role: "AI & Machine Learning Engineer", avatar: "🤖", color: "from-green-500 to-teal-600" },
    { name: "Master Suraj Katkar", role: "UI/UX Designer", avatar: "🎨", color: "from-pink-500 to-rose-600" },
    { name: "Miss Shazia Khateeb", role: "Computer Vision Specialist", avatar: "👁️", color: "from-purple-500 to-indigo-600" },
    { name: "Master Swaraj Pawar", role: "Quality Assurance", avatar: "🔍", color: "from-orange-500 to-red-600" },
    { name: "Master Prasad Kandekar", role: "Frontend Developer", avatar: "⚡", color: "from-cyan-500 to-blue-600" },
    { name: "Master Rehan Mamidwar", role: "Backend Developer", avatar: "⚙️", color: "from-gray-500 to-slate-600" },
    { name: "Master Meet Raval", role: "Flutter App Developer", avatar: "📱", color: "from-emerald-500 to-green-600" }
  ];

  const coreValues = [
    {
      icon: <GraduationCap size={32} />,
      title: "Educational Excellence",
      description: "We enhance the learning experience through thoughtful, tech-driven solutions.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users size={32} />,
      title: "Student-Centered Approach",
      description: "Every feature is designed to prioritize student well-being and engagement.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Award size={32} />,
      title: "Quality & Reliability",
      description: "We follow high standards to ensure robust and dependable systems.",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: <Target size={32} />,
      title: "Continuous Innovation",
      description: "We constantly integrate new technologies to stay ahead.",
      color: "from-purple-500 to-purple-600"
    }
  ];

  const storySteps = [
    {
      icon: <Lightbulb size={24} />,
      title: "The Vision",
      text: "Campus Connect began as a project with a vision to transform how educational institutions manage daily Attendance using AI, facial recognition, and data analytics.",
      year: "2025"
    },
    {
      icon: <Code size={24} />,
      title: "The Evolution",
      text: "It evolved into a full-fledged platform addressing attendance, student tracking, stress management, and performance analytics.",
      year: "Present"
    },
    {
      icon: <Star size={24} />,
      title: "The Impact",
      text: "Today, it stands as a beacon of innovation, combining functionality with modern design and educational foresight.",
      year: "Future"
    }
  ];
 

  return (
    <div className="relative">
      {/* Background gradient and floating elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200 to-red-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-br from-green-200 to-green-300 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg mb-6">
              <BookOpen size={16} />
              About Our Mission
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 text-gray-600">
            About{' '}
            <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
              Campus Connect
            </span>
          </h1>
          
          <p className="text-xl text-[#6b6d71] max-w-4xl mx-auto leading-relaxed mb-12">
            Revolutionizing campus management through innovative technology solutions that bridge the gap between education and digital transformation
          </p>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
              <div className="text-3xl font-bold text-[#b22b2f] mb-2">{animatedStats.projects}+</div>
              <div className="text-[#6b6d71]">Features Implemented</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="text-3xl font-bold text-[#b22b2f] mb-2">{animatedStats.students}+</div>
              <div className="text-[#6b6d71]">Students Impacted</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
              <div className="text-3xl font-bold text-[#b22b2f] mb-2">{animatedStats.satisfaction}%</div>
              <div className="text-[#6b6d71]">Satisfaction Rate</div>
            </div>
          </div>
        </div>

        {/* Our Story - Timeline */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#6b6d71] mb-4">Our Story</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-red-600 to-red-700 rounded-full"></div>
              
              {storySteps.map((step, index) => (
                <div key={index} className={`flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className={`inline-flex items-center gap-2 mb-3 ${index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="bg-gradient-to-r from-[#b22b2f] to-[#a02529] text-white p-2 rounded-lg">
                          {step.icon}
                        </div>
                        <span className="text-sm font-semibold text-[#b22b2f]">{step.year}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#6b6d71] mb-3">{step.title}</h3>
                      <p className="text-[#6b6d71] leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-red-600 rounded-full shadow-lg"></div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Project Guides */}
        {/* <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Project Guides</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {guides.map((guide, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-700"></div>
                  
               
                  <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                    {guide.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{guide.name}</h3>
                  <p className="text-red-600 font-semibold mb-4 flex items-center gap-2">
                    <Award size={16} />
                    {guide.title}
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-6">{guide.description}</p>
                  
              
                  <div className="flex flex-wrap gap-2">
                    {guide.expertise.map((skill, skillIndex) => (
                      <span key={skillIndex} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium border border-red-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* Team Members */}
        {/* <section className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Meet Our Team</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto rounded-full"></div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              A diverse group of passionate individuals working together to revolutionize campus management
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {teamMembers.map((member, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
               
                  <div className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
            
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-2xl shadow-lg relative z-10`}>
                    {member.avatar}
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-800 mb-2 relative z-10">{member.name}</h4>
                  <p className="text-sm text-gray-600 relative z-10">{member.role}</p>
                  
        
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* Core Values */}
        <section className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-100 to-transparent rounded-full opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-50"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[#6b6d71] mb-4">Our Core Values</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-700 mx-auto rounded-full"></div>
              <p className="text-[#6b6d71] mt-4 max-w-2xl mx-auto">
                The principles that guide our mission and drive our innovation in educational technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {coreValues.map((value, index) => (
                <div key={index} className="group text-center">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                    {/* Icon container */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b22b2f] to-[#a02529] flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {value.icon}
                    </div>
                    
                    <h4 className="text-xl font-bold text-[#6b6d71] mb-4">{value.title}</h4>
                    <p className="text-[#6b6d71] leading-relaxed">{value.description}</p>
                    
                    {/* Subtle hover line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#b22b2f] to-[#a02529] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center mt-20">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Campus?</h3>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join us in revolutionizing educational management with cutting-edge technology
              </p>
              
              <button  onClick={() => navigate("/contact")} className="bg-white text-[#b22b2f] font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto">
                Get Started Today
                <ChevronRight size={20} />
              </button>
              
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

// import React from 'react';
// import { GraduationCap, Users, Award, Target } from 'lucide-react';
// import { motion } from 'framer-motion';
// import Navbar from '../components/common/Navbar';
// import Footer from '../components/common/Footer';

// const About = () => {
//   const guides = [
//     {
//       name: "Prof. Atul Kathole",
//       title: "Project Guide",
//       description: "With over 15 years of experience in computer science education and research, Prof. Kathole specializes in AI and computer vision technologies. His guidance has been instrumental in developing our facial recognition attendance system."
//     },
//     {
//       name: "Prof. Suvarna Patil",
//       title: "Guide",
//       description: "An expert in software engineering and database management, Prof. Patil brings valuable insights into system architecture and data security. Her mentorship ensures our platform meets the highest standards of reliability and performance."
//     }
//   ];

//   const teamMembers = [
//     { name: "Master Sanskar Dagade", role: "Team Lead & Full-Stack Developer" },
//     { name: "Master Deepak Zamnani", role: "AI & Machine Learning Engineer" },
//     { name: "Master Suraj Katkar", role: "UI/UX Designer" },
//     { name: "Miss Shazia Khateeb", role: "Computer Vision Specialist" },
//     { name: "Master Swaraj Pawar", role: "Quality Assurance" },
//     { name: "Master Prasad Kandekar", role: "Frontend Developer" },
//     { name: "Master Rehan Mamidwar", role: "Backend Developer" },
//     { name: "Master Meet Raval", role: "Flutter App Developer" }
//   ];

//   const coreValues = [
//     {
//       icon: <GraduationCap size={28} />,
//       title: "Educational Excellence",
//       description: "We enhance the learning experience through thoughtful, tech-driven solutions."
//     },
//     {
//       icon: <Users size={28} />,
//       title: "Student-Centered Approach",
//       description: "Every feature is designed to prioritize student well-being and engagement."
//     },
//     {
//       icon: <Award size={28} />,
//       title: "Quality & Reliability",
//       description: "We follow high standards to ensure robust and dependable systems."
//     },
//     {
//       icon: <Target size={28} />,
//       title: "Continuous Innovation",
//       description: "We constantly integrate new technologies to stay ahead."
//     }
//   ];

//   return (
//     <>
//       <Navbar />

//       <div className="bg-gray-100 text-gray-900 min-h-screen px-4 py-12">
//         {/* Title */}
//         <div className="text-center mb-16">
//           <h2 className="text-4xl font-bold mb-3">About <span className="text-red-600">Campus Connect</span></h2>
//           <p className="text-lg text-gray-600 max-w-3xl mx-auto">
//             Revolutionizing campus management through innovative technology solutions
//           </p>
//         </div>

//         {/* Our Story */}
//         <section className="mb-20">
//           <h3 className="text-3xl font-semibold text-red-600 mb-8">Our Story</h3>
//           <div className="space-y-6 border-l-4 border-red-500 pl-6">
//             {[
//               "Campus Connect began as a project with a vision to transform how educational institutions manage daily operations using AI, facial recognition, and data analytics.",
//               "It evolved into a full-fledged platform addressing attendance, student tracking, stress management, and performance analytics.",
//               "Today, it stands as a beacon of innovation, combining functionality with modern design and educational foresight."
//             ].map((text, index) => (
//               <motion.p
//                 key={index}
//                 initial={{ opacity: 0, x: -20 }}
//                 whileInView={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: index * 0.2 }}
//                 className="text-gray-700 text-base"
//               >
//                 {text}
//               </motion.p>
//             ))}
//           </div>
//         </section>

//         {/* Project Guides */}
//         <section className="mb-20">
//           <h3 className="text-3xl font-semibold text-center text-red-600 mb-10">Our Project Guides</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {guides.map((guide, index) => (
//               <motion.div
//                 key={index}
//                 whileHover={{ scale: 1.02 }}
//                 className="bg-red-200 rounded-xl shadow-md p-6 border border-red-500"
//               >
//                 <h4 className="text-xl font-bold text-gray-800">{guide.name}</h4>
//                 <p className="text-sm font-medium text-red-600 mb-2">{guide.title}</p>
//                 <p className="text-gray-600 text-sm">{guide.description}</p>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* Team Members */}
//         <section className="mb-20">
//           <h3 className="text-3xl font-semibold text-center text-red-600 mb-10">Meet Our Team</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//             {teamMembers.map((member, index) => (
//               <motion.div
//                 key={index}
//                 whileHover={{ scale: 1.05 }}
//                 className="bg-red-200 border-red-600 rounded-lg shadow-md p-4 text-center transition"
//               >
//                 <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full border-2 border-red-500">
//                   <img
//                     src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThWke775M1_jjgJ_xFVlmmo3Spu3DlHk4LrQ&s"
//                     alt={member.name}
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <h4 className="text-lg font-bold text-gray-800">{member.name}</h4>
//                 <p className="text-sm text-gray-500">{member.role}</p>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* Core Values */}
//         <section className="bg-white rounded-xl p-10 shadow-lg border border-gray-200">
//           <h3 className="text-3xl font-semibold text-center text-red-600 mb-10">Our Core Values</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {coreValues.map((value, index) => (
//               <motion.div
//                 key={index}
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.4, delay: index * 0.2 }}
//                 className="text-center px-4"
//               >
//                 <div className="bg-red-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-md">
//                   {value.icon}
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-800 mb-2">{value.title}</h4>
//                 <p className="text-sm text-gray-600">{value.description}</p>
//               </motion.div>
//             ))}
//           </div>
//         </section>
//       </div>

//       <Footer />
//     </>
//   );
// };

// export default About;


// // import React from 'react';
// // import { GraduationCap, Users, Award, Target } from 'lucide-react';
// // import { motion } from 'framer-motion';
// // import Navbar from '../components/common/Navbar';
// // import Footer from '../components/common/Footer';

// // const About = () => {
// //   const guides = [
// //     {
// //       name: "Prof. Atul Kathole",
// //       title: "Project Guide",
// //       description: "With over 15 years of experience in computer science education and research, Prof. Kathole specializes in AI and computer vision technologies. His guidance has been instrumental in developing our facial recognition attendance system."
// //     },
// //     {
// //       name: "Prof. Suvarna Patil",
// //       title: "Guide",
// //       description: "An expert in software engineering and database management, Prof. Patil brings valuable insights into system architecture and data security. Her mentorship ensures our platform meets the highest standards of reliability and performance."
// //     }
// //   ];

// //   const teamMembers = [
// //     { name: "Master Sanskar Dagade", role: "Team Lead & Full-Stack Developer" },
// //     { name: "Master Deepak Zamnani", role: "AI & Machine Learning Engineer" },
// //     { name: "Master Suraj Katkar", role: "UI/UX Designer" },
// //     { name: "Miss Shazia Khateeb", role: "Computer Vision Specialist" },
// //     { name: "Master Swaraj Pawar", role: "Quality Assurance" },
// //     { name: "Master Prasad Kandekar", role: "Frontend Developer" },
// //     { name: "Master Rehan Mamidwar", role: "Backend Developer" },
// //     { name: "Master Meet Raval", role: "Flutter App Developer" }
// //   ];

// //   const coreValues = [
// //     {
// //       icon: <GraduationCap size={32} />,
// //       title: "Educational Excellence",
// //       description: "We believe in enhancing the educational experience through innovative technology solutions."
// //     },
// //     {
// //       icon: <Users size={32} />,
// //       title: "Student-Centered Approach",
// //       description: "Every feature we develop puts student needs and well-being at the forefront."
// //     },
// //     {
// //       icon: <Award size={32} />,
// //       title: "Quality & Reliability",
// //       description: "Our systems are built with the highest standards to ensure consistent performance."
// //     },
// //     {
// //       icon: <Target size={32} />,
// //       title: "Continuous Innovation",
// //       description: "We constantly evolve our platform to incorporate emerging technologies and methodologies."
// //     }
// //   ];

// //   return (
// //     <>
// //       <Navbar />

// //       <div className="bg-[#2b0000] text-white min-h-screen px-4 py-10">
// //         <div className="text-center mb-16">
// //           <h2 className="text-4xl font-extrabold text-white mb-4">About Campus Connect</h2>
// //           <p className="text-lg text-red-200 max-w-3xl mx-auto">
// //             Revolutionizing campus management through innovative technology solutions
// //           </p>
// //         </div>

// //         {/* Our Story with Timeline style */}
// //         <section className="mb-20">
// //           <h3 className="text-3xl font-bold text-red-400 mb-10">Our Story</h3>
// //           <div className="space-y-6 border-l-4 border-red-600 pl-6">
// //             {[
// //               "Campus Connect began as a final year project with a vision to transform how educational institutions manage daily operations using AI, facial recognition, and data analytics.",
// //               "It evolved into a full-fledged platform addressing attendance, student tracking, stress management, and performance analytics.",
// //               "Today, it stands as a beacon of innovation, combining functionality with modern design and educational foresight."
// //             ].map((text, index) => (
// //               <motion.p
// //                 key={index}
// //                 initial={{ opacity: 0, x: -30 }}
// //                 whileInView={{ opacity: 1, x: 0 }}
// //                 transition={{ duration: 0.5, delay: index * 0.2 }}
// //                 className="text-red-100 text-md leading-relaxed"
// //               >
// //                 {text}
// //               </motion.p>
// //             ))}
// //           </div>
// //         </section>

// //         {/* Project Guides */}
// //         <section className="mb-20">
// //           <h3 className="text-3xl font-bold text-center text-white mb-10">Our Project Guides</h3>
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
// //             {guides.map((guide, index) => (
// //               <motion.div
// //                 key={index}
// //                 whileHover={{ scale: 1.02 }}
// //                 className="bg-[#3b0a0a] rounded-lg shadow-xl p-6 transition"
// //               >
// //                 <h4 className="text-xl font-bold text-red-300 mb-1">{guide.name}</h4>
// //                 <p className="text-red-400 font-semibold mb-2">{guide.title}</p>
// //                 <p className="text-red-100">{guide.description}</p>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>

// //         {/* Team Members */}
// //         <section className="mb-20">
// //           <h3 className="text-3xl font-bold text-center text-white mb-10">Meet Our Team</h3>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
// //             {teamMembers.map((member, index) => (
// //               <motion.div
// //                 key={index}
// //                 whileHover={{ scale: 1.05 }}
// //                 className="bg-[#3b0a0a] rounded-lg shadow-lg p-4 text-center transition-all duration-300"
// //               >
// //                 <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full border-4 border-red-700">
// //                   <img
// //                     src={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThWke775M1_jjgJ_xFVlmmo3Spu3DlHk4LrQ&s'}
// //                     alt={member.name}
// //                     className="w-full h-full object-cover"
// //                   />
// //                 </div>
// //                 <h4 className="text-lg font-bold text-red-300">{member.name}</h4>
// //                 <p className="text-sm text-red-100">{member.role}</p>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>

// //         {/* Core Values */}
// //         <section className="bg-[#400202] rounded-lg p-8 text-white shadow-xl">
// //           <h3 className="text-3xl font-bold mb-10 text-center text-red-300">Our Core Values</h3>
// //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
// //             {coreValues.map((value, index) => (
// //               <motion.div
// //                 key={index}
// //                 initial={{ opacity: 0, y: 20 }}
// //                 whileInView={{ opacity: 1, y: 0 }}
// //                 transition={{ duration: 0.4, delay: index * 0.2 }}
// //                 className="text-center"
// //               >
// //                 <div className="bg-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
// //                   {value.icon}
// //                 </div>
// //                 <h4 className="text-xl font-semibold text-red-200 mb-2">{value.title}</h4>
// //                 <p className="text-sm text-red-100">{value.description}</p>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>
// //       </div>

// //       <Footer />
// //     </>
// //   );
// // };

// // export default About;
