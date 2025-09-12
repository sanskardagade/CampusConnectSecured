const express = require('express');
const router = express.Router();
const { getGeminiResponse } = require('../services/geminiService');

// Get chatbot response
router.post('/message', async (req, res) => {
  try {

    const { message } = req.body;
    
    if (!message) {
      console.error('Missing message in request body');
      return res.status(400).json({ 
        message: 'Message is required',
        error: 'Missing message in request body' 
      });
    }                                                   

    try {
      // Get response from Gemini
      const response = await getGeminiResponse(message);
      console.log('Successfully got response from Gemini');
      res.json({ response });
    } catch (geminiError) {
      console.error('Gemini API error:', {
        error: geminiError,
        message: geminiError.message,
        stack: geminiError.stack
      });
      res.status(500).json({ 
        message: 'Error processing message with Gemini API',
        error: geminiError.message || 'Unknown error occurred'
      });
    }
  } catch (error) {
    console.error('Chatbot route error:', {
      error: error,
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({ 
      message: 'Error processing message',
      error: error.message || 'Unknown error occurred'
    });
  }
});

module.exports = router; 