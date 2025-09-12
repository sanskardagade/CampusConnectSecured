import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Youtube, 
  Linkedin, 
  Instagram, 
  Facebook,
  ChevronDown
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Features from './Features';
import About from './About';
import Contact from './Contact';
import CollegeName from '../assets/dit_logo.png';
import MainImg from '../assets/dit_image.png';
import CollegeIllustration from '../assets/dpyit_illustration.png';
import AttendanceIllustration from '../assets/attendance_illustration.png';
import DitImage from '../assets/dit_image.png'
import HeaderCollege from '../components/common/HeaderCollege';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentNotice, setCurrentNotice] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);

  // News/Notices Data
  const notices = [
    { 
      title: 'Campus Reopening', 
      content: 'Institute reopens July 1st with enhanced safety protocols.',
      date: 'June 28, 2025'
    },
    { 
      title: 'ATAL FDP for one week', 
      content: 'Faculty Knowledge enhancement on GenAI and Cloud Computing',
      date:'June 28, 2025'
    }
  ];

  // Gallery Images
  const galleryImages = [MainImg];

  // Social Media Links
  const socialLinks = [
    { icon: Youtube, url: 'https://youtube.com' },
    { icon: Linkedin, url: 'https://linkedin.com' },
    { icon: Instagram, url: 'https://instagram.com' },
    { icon: Facebook, url: 'https://facebook.com' }
  ];

  // Auto-rotate notices and gallery
  useEffect(() => {
    const noticeTimer = setInterval(() => {
      setCurrentNotice((prev) => (prev + 1) % notices.length);
    }, 5000);
    
    const galleryTimer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % galleryImages.length);
    }, 4000);
    
    return () => {
      clearInterval(noticeTimer);
      clearInterval(galleryTimer);
    };
  }, [notices.length, galleryImages.length]);

  // Scroll to top button
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <HeaderCollege />
      <Navbar />

      {/* Main Content Container */}
      <div className="w-full relative">
        {/* Hero Section */}
        <section 
          id="home" 
          className="w-full flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-16 relative bg-cover bg-center"
          style={{ backgroundImage: `url(${DitImage})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          {/* Main Content */}
          <div className="relative z-10 w-full flex flex-col items-center justify-center text-center">
            {/* Centered Logo and Institute Info */}
            {/* <div className="w-full flex flex-col items-center justify-center mb-8">
              <img 
                src={CollegeName}
                alt="College Logo" 
                className="w-64 h-64 object-contain mb-4"
              />
              <div className="text-center">
                <div className="text-lg font-medium text-red-900">Dr. D. Y. Patil Unitech Society's</div>
                <div className="text-3xl font-bold mt-1 mb-4 text-red-900">Dr. D. Y. Patil Institute of Technology</div>
              </div>
            </div> */}

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Welcome to <span className="text-[#b22b2f] font-bold">CampusConnect</span>
            </h1>
            <p className="text-xl md:text-2xl text-white mb-12 leading-relaxed max-w-2xl">
              Revolutionizing campus management with AI-powered attendance tracking and student wellness monitoring.
            </p>
            <button
              onClick={() => navigate("/signin")}
              className="bg-[#b22b2f] text-white px-14 py-5 rounded-xl text-xl font-semibold hover:bg-[#a02529] transition-all shadow-lg mb-10 mx-auto"
            >
              Sign In
            </button>

            {/* News & Notices Section */}
            <div
              className="bg-gray-200/90 backdrop-blur-sm rounded-xl shadow-md p-4 border border-red-100 w-full max-w-md mt-2"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-[#6b6d71]">News & Notices</h2>
                <div className="flex space-x-2">
                  {notices.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentNotice(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentNotice ? 'bg-red-900' : 'bg-red-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="relative h-20 overflow-hidden">
                {notices.map((notice, index) => (
                  <div
                    key={index}
                    className="absolute inset-0 p-1"
                    style={{ 
                      opacity: index === currentNotice ? 1 : 0,
                      transform: `translateY(${index === currentNotice ? 0 : 10}px)`,
                      transition: 'opacity 0.5s, transform 0.5s'
                    }}
                  >
                    <div className="h-full flex flex-col">
                      <span className="text-xs text-[#b22b2f] font-medium">{notice.date}</span>
                      <h3 className="text-base font-bold text-[#6b6d71] mt-1">{notice.title}</h3>
                      <p className="text-xs text-[#6b6d71] mt-1">{notice.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-50 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Features />
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-white w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <About />
          </div>
        </section>

        {/* Contact Section */}
        {/* <section id="contact" className="py-16 bg-gray-50 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-[#6b6d71] mb-2">Get In Touch</h2>
              <p className="text-lg text-[#6b6d71] max-w-3xl mx-auto">
                Have questions? We'd love to hear from you
              </p>
            </div>
            <Contact />
          </div>
        </section> */}

        {/* CTA Section */}
        {/* <section className="py-12 bg-red-900 text-white w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Ready to transform your campus experience?</h2>
              <button
                onClick={() => navigate("/signin")}
                className="px-8 py-3 bg-white text-[#b22b2f] rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </section> */}
      </div>

      <Footer />

      {/* Scroll to top button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-red-800 text-white p-3 rounded-full shadow-lg z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Floating Social Icons */}
      <div
        className="fixed bottom-6 left-6 flex flex-col space-y-3 z-50 bg-white/80 rounded-xl p-3 shadow-lg"
      >
        {socialLinks.map((social, index) => (
          <a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6b6d71] hover:text-[#b22b2f] transition-colors"
          >
            <social.icon className="w-6 h-6" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;

