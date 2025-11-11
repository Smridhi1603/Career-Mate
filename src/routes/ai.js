const express = require('express');
const { requireAuth } = require('../middleware/auth');
const aiService = require('../services/aiService');
const router = express.Router();

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const prompt = `You are a helpful AI study assistant for Career-Mate, an online learning platform. Answer the following question in a clear, educational, and friendly way. Keep your response concise but informative (2-4 paragraphs max).

Question: ${message}`;

    const aiReply = await aiService.generateResponse(prompt);
    res.json({ reply: aiReply, audioUrl: null });
  } catch (error) {
    console.error('AI chat error:', error);

    if (error.message.includes('API key')) {
      return res.status(401).json({
        message: 'AI service configuration error. Please contact support.',
        error: 'Invalid API key configuration'
      });
    }
    
    if (error.message.includes('PERMISSION_DENIED')) {
      return res.status(403).json({
        message: 'AI service access denied. Please contact support.',
        error: 'Permission denied'
      });
    }

    res.status(500).json({
      message: 'Sorry, I encountered an error. Please try again in a moment.',
      error: error.message
    });
  }
});

module.exports = router;
