import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import HeaderCollege from '../components/common/HeaderCollege';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    isLoading: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus({ submitted: false, error: false, isLoading: true });
    
    // Simulate form submission with loading state
    setTimeout(() => {
      setFormStatus({ submitted: true, error: false, isLoading: false });
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  return (
    <>
    <HeaderCollege/>
    <Navbar/>
      <section className="relative py-20 bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Header with animation */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block p-2 bg-red-100 rounded-full mb-4 animate-bounce-subtle">
              <Mail className="w-8 h-8 text-red-900" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-red-900 to-red-700 bg-clip-text text-transparent">
              Contact Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions about Campus Connect? We're here to help and would love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Contact Information */}
            <div className="lg:col-span-1 animate-slide-in-left">
              <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl shadow-2xl p-8 text-white h-full relative overflow-hidden transform hover:scale-105 transition-all duration-300">
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-700 rounded-full opacity-20"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-red-700 rounded-full opacity-10"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-8 flex items-center">
                    <div className="w-2 h-8 bg-white rounded-full mr-3"></div>
                    Contact Information
                  </h3>
                  
                  <div className="space-y-8">
                    {[
                      {
                        icon: MapPin,
                        title: "Address",
                        content: ["Dr. D. Y. Patil Institute of Technology", "Sant Tukaram Nagar ", "Pimpri, Pune - 411018"],
                        delay: "0s"
                      },
                      {
                        icon: Phone,
                        title: "Phone",
                        content: ["+1 (555) 123-4567", "+1 (555) 765-4321"],
                        delay: "0.2s"
                      },
                      {
                        icon: Mail,
                        title: "Email",
                        content: ["support@campusconnect.edu", "info@campusconnect.edu"],
                        delay: "0.4s"
                      },
                      {
                        icon: Clock,
                        title: "Hours",
                        content: ["Monday - Friday: 8:00 AM - 6:00 PM", "Saturday: 9:00 AM - 1:00 PM", "Sunday: Closed"],
                        delay: "0.6s"
                      }
                    ].map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-start group hover:bg-red-800/30 rounded-lg p-3 -m-3 transition-all duration-300"
                        style={{ animationDelay: item.delay }}
                      >
                        <div className="mr-4 mt-1 p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-all duration-300">
                          <item.icon size={24} className="group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                          {item.content.map((line, idx) => (
                            <p key={idx} className="text-red-100 leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Contact Form */}
            <div className="lg:col-span-2 animate-slide-in-right">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 h-full border border-red-100">
                <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                  <Send className="w-8 h-8 text-red-900 mr-3" />
                  Send us a message
                </h3>
                <p className="text-gray-600 mb-8">We'll get back to you within 24 hours</p>
                
                {/* Enhanced Status Messages */}
                {formStatus.submitted && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6 animate-slide-in-down">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <p className="text-green-700 font-medium">Thank you for your message! We'll get back to you soon.</p>
                    </div>
                  </div>
                )}
                
                {formStatus.error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6 animate-slide-in-down">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                      <p className="text-red-700 font-medium">There was an error sending your message. Please try again.</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                      <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all duration-300 bg-white/70 hover:bg-white"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all duration-300 bg-white/70 hover:bg-white"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all duration-300 bg-white/70 hover:bg-white"
                      placeholder="How can we help?"
                    />
                  </div>
                  
                  <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 outline-none transition-all duration-300 resize-none bg-white/70 hover:bg-white"
                      placeholder="Type your message here..."
                    ></textarea>
                  </div>
                  
                  <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <button 
                      onClick={handleSubmit}
                      disabled={formStatus.isLoading}
                      className="bg-gradient-to-r from-red-900 to-red-800 text-white font-semibold py-4 px-8 rounded-xl hover:from-red-800 hover:to-red-700 transition-all duration-300 w-full md:w-auto transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {formStatus.isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.7s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.7s ease-out forwards;
        }
        
        .animate-slide-in-down {
          animation: slide-in-down 0.4s ease-out forwards;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      <Footer/>
    </>
  );
};

export default Contact;

// import React, { useState } from 'react';
// import { MapPin, Phone, Mail, Clock } from 'lucide-react';
// import Footer from '../components/common/Footer';
// import Navbar from '../components/common/Navbar';

// const Contact = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     subject: '',
//     message: ''
//   });
  
//   const [formStatus, setFormStatus] = useState({
//     submitted: false,
//     error: false
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevState => ({
//       ...prevState,
//       [name]: value
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const { name, email, subject, message } = formData;
//     const gmailLink = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=sanskardagade@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
//     window.location.href = gmailLink;
//   };

//   return (
//     <>
//     <Navbar/>
//     <section className="py-16 bg-gray-50">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Contact Us</h2>
//           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//             Have questions about Campus Connect? We're here to help.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Contact Information */}
//           <div className="lg:col-span-1">
//             <div className="bg-red-900 rounded-lg shadow-lg p-8 text-white h-full">
//               <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              
//               <div className="space-y-6">
//                 <div className="flex items-start">
//                   <div className="mr-4 mt-1">
//                     <MapPin size={24} />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-lg">Address</h4>
//                     <p className="text-red-100"> Dr.D.Y Patil Institute of Technology</p>
//                     <p className="text-red-100">Sant Tukaram Nagar,Pimpri-Chinchwad</p>
//                     <p className="text-red-100">411018</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-start">
//                   <div className="mr-4 mt-1">
//                     <Phone size={24} />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-lg">Phone</h4>
//                     <p className="text-red-100">+91 9960889772</p>
//                     <p className="text-red-100">+91 7588735942</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-start">
//                   <div className="mr-4 mt-1">
//                     <Mail size={24} />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-lg">Email</h4>
//                     <p className="text-red-100">atul.kathole@dypvp.edu.in</p>
//                     <p className="text-red-100">suvarna.patil@dypvp.edu.in</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-start">
//                   <div className="mr-4 mt-1">
//                     <Clock size={24} />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold text-lg">Hours</h4>
//                     <p className="text-red-100">Monday - Friday: 8:00 AM - 6:00 PM</p>
//                     <p className="text-red-100">Saturday: 9:00 AM - 1:00 PM</p>
//                     <p className="text-red-100">Sunday: Closed</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           {/* Contact Form */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-lg shadow-lg p-8 h-full">
//               <h3 className="text-2xl font-bold text-gray-800 mb-6">Send us a message</h3>
              
//               {formStatus.submitted ? (
//                 <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6">
//                   Thank you for your message! We'll get back to you soon.
//                 </div>
//               ) : formStatus.error ? (
//                 <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
//                   There was an error sending your message. Please try again.
//                 </div>
//               ) : null}
              
//               <form onSubmit={handleSubmit}>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                   <div>
//                     <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
//                       Your Name
//                     </label>
//                     <input
//                       type="text"
//                       id="name"
//                       name="name"
//                       required
//                       value={formData.name}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none transition-all"
//                       placeholder="John Doe"
//                     />
//                   </div>
                  
//                   <div>
//                     <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
//                       Your Email
//                     </label>
//                     <input
//                       type="email"
//                       id="email"
//                       name="email"
//                       required
//                       value={formData.email}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none transition-all"
//                       placeholder="john@example.com"
//                     />
//                   </div>
//                 </div>
                
//                 <div className="mb-6">
//                   <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
//                     Subject
//                   </label>
//                   <input
//                     type="text"
//                     id="subject"
//                     name="subject"
//                     required
//                     value={formData.subject}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none transition-all"
//                     placeholder="How can we help?"
//                   />
//                 </div>
                
//                 <div className="mb-6">
//                   <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
//                     Message
//                   </label>
//                   <textarea
//                     id="message"
//                     name="message"
//                     required
//                     rows="5"
//                     value={formData.message}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 outline-none transition-all resize-none"
//                     placeholder="Type your message here..."
//                   ></textarea>
//                 </div>
                
//                 <button 
//                   type="submit" 
//                   className="bg-red-900 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-800 transition-all duration-300 w-full md:w-auto"
//                 >
//                   Send Message
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
        
//         {/* Map Section */}
//         <div className="mt-16">
//           <div className="bg-white rounded-lg shadow-lg p-4 h-96">
            
//             {/* Replace with actual map implementation */}
//             <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
//               <iframe
//                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3781.1243182635386!2d73.8160199!3d18.6230833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b860d63876d1%3A0x9bccd5081468bc36!2sDr.%20D.%20Y.%20Patil%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1715253789847!5m2!1sen!2sin"
//                 width="100%"
//                 height="100%"
//                 style={{ border: 0, borderRadius: "0.5rem" }}
//                 allowFullScreen=""
//                 loading="lazy"
//                 referrerPolicy="no-referrer-when-downgrade"
//               ></iframe>
//             </div>


//           </div>
//         </div>
//       </div>
//     </section>
//     <Footer/>
//     </>
//   );
// };

// export default Contact;