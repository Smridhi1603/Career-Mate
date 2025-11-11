const fetch = require('node-fetch');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async generateResponse(message) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are CareerMate, an advanced AI study assistant specialized in education and career guidance. Your role is to provide clear, accurate explanations of academic concepts, break down complex topics into understandable parts, give practical examples, offer study tips and learning strategies, help with programming and technical concepts, guide students in their career decisions, and maintain a supportive and encouraging tone. Try to generate text without special characters like "-", "*", etc.

When responding, structure your answers clearly with headings, bullet points, or numbered lists where appropriate.

User Query: ${message}

Please provide a helpful, structured response:`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || 'AI service error');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('No valid response from Gemini:', data);
      throw new Error('No valid response generated');
    }

    return text;
  }
}

module.exports = new AIService();
