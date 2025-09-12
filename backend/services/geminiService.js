const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../secure/gemini.env') });

// Log environment variables (remove in production)
console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Context for the chatbot to maintain conversation context
const context = `You are a helpful assistant for a campus management system called Campus Connect. 
The system has features like:
- Attendance tracking of faculty and student through CCTV face recognition
- Course management and materials
- Student stress management
- Real-time campus notifications
- Student location tracking
- Department management
- Leave management for faculty where leave is approved by HOD and Principal

Please provide helpful, concise responses related to these features. If asked about something outside these features, 
politely inform that you can only help with campus-related queries.`;

async function getGeminiResponse(message) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Start a chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll help users with Campus Connect related queries." }],
        },
      ],
    });

    // Get response from Gemini
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw new Error(`Failed to get response from AI: ${error.message}`);
  }
}

module.exports = {
  getGeminiResponse
}; 