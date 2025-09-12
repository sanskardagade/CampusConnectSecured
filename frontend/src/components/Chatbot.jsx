import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiX, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hello! I\'m your Campus Connect assistant powered by Gemini AI. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpText, setShowHelpText] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: input.trim()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://69.62.83.14:9000/api/chatbot/message', 
        { message: userMessage.content }
      );

      // Add bot response
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        type: 'bot',
        content: 'Hello! I\'m your Campus Connect assistant powered by Gemini AI. How can I help you today?'
      }
    ]);
  };

  return (
    <>
      {/* Show 'How may I help you?' above the chat button when chat is closed */}
      <AnimatePresence>
        {!isOpen && showHelpText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 flex justify-center w-48 sm:w-60 pointer-events-none"
          >
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded-t-lg font-semibold shadow text-center w-full text-sm sm:text-base">
              How may I help you?
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button */}
      <motion.button
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-red-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-red-800 transition-colors z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setShowHelpText(true)}
        onMouseLeave={() => setShowHelpText(false)}
      >
        <FiMessageCircle size={20} className="sm:w-6 sm:h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-96 sm:h-[500px] bg-white rounded-none sm:rounded-lg shadow-xl flex flex-col z-50"
          >
            {/* Chat Header */}
            <div className="bg-red-700 text-white p-3 sm:p-4 rounded-none sm:rounded-t-lg flex justify-between items-center">
              <h3 className="font-semibold text-sm sm:text-base">Campus Connect Assistant</h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={handleClearChat}
                  className="hover:text-gray-200 transition-colors p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Clear chat"
                >
                  <FiTrash2 size={18} className="sm:w-5 sm:h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="hover:text-gray-200 transition-colors p-1"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={18} className="sm:w-5 sm:h-5" />
                </motion.button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 text-sm sm:text-base ${
                      message.type === 'user'
                        ? 'bg-red-700 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-2 sm:p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 text-sm sm:text-base"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className={`bg-red-700 text-white p-2 sm:p-3 rounded-lg transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-800'
                  }`}
                >
                  <FiSend size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;