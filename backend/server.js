const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage untuk chat history
const chatHistory = {};
let messageId = 0;

// Available AI Models - Only Llama 3.2 and Gemini
const AVAILABLE_MODELS = [
  {
    id: 'llama',
    name: 'Llama 3.2',
    provider: 'local',
    description: 'Local Ollama model - Fast & Private',
    icon: '🦙'
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Cloud-based Google AI',
    icon: '✨'
  }
];

// Python Backend Integration
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// AI Response Generator - Mock version for Portfolio purposes
async function generateAIResponse(message, model) {
  // Simulate network delay to make it feel like real AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('enroll') || lowerMessage.includes('deadline')) {
    return "If you missed the deadline for enrollment, you should immediately contact the Academic Bureau. Late enrollments are subject to approval and may incur a late fee. You can reach them at academic@president.ac.id or visit their office in Building A.";
  }
  if (lowerMessage.includes('drop') || lowerMessage.includes('classes') || lowerMessage.includes('subjects')) {
    return "Yes, you can drop subjects during the Add/Drop period, which is typically the first two weeks of the semester. After this period, dropping a class will result in a 'W' (Withdrawal) on your transcript. Please consult with your academic advisor before making changes.";
  }
  if (lowerMessage.includes('gpa') || lowerMessage.includes('access')) {
    return "If you can't access your GPA, it might be due to pending administrative requirements or library fines. Please check your PUIS (President University Information System) dashboard for any holds on your account, or contact the Finance Department if it's related to tuition payments.";
  }
  if (lowerMessage.includes('major') || lowerMessage.includes('concentration')) {
    return "Changing your major or concentration is possible, but it requires approval from both your current Head of Study Program and the one you wish to transfer to. You must fill out the 'Change of Major' form available at the Academic Bureau and meet the specific GPA requirements for the new program.";
  }
  if (lowerMessage.includes('academic bureau') || lowerMessage.includes('meet') || lowerMessage.includes('consult')) {
    return "You can definitely meet a representative from the Academic Bureau! Their office hours are Monday to Friday, from 08:00 AM to 04:00 PM. They are located on the first floor of Building A. It's recommended to schedule an appointment via PUIS beforehand to avoid long queues.";
  }
  if (lowerMessage.includes('transfer')) {
    return "Transferring to President University requires you to submit your previous academic transcripts for evaluation. The admission team will assess which credits can be transferred. Please contact admission@president.ac.id for the complete transfer student guidelines.";
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ')) {
    return `Hello there! I'm Jarvis AI powered by ${model === 'gemini' ? 'Gemini 2.5 Flash' : 'Llama 3.2'}. How can I assist you with your academic inquiries at President University today?`;
  }
  
  return `That's an interesting question about "${message}". As an AI assistant for President University, I'm constantly learning. For specific details regarding this matter, I would recommend checking the student handbook or contacting the relevant academic department directly.`;
}

// Routes

// Get available models
app.get('/api/models', (req, res) => {
  res.json({
    success: true,
    models: AVAILABLE_MODELS
  });
});

// Get greeting with suggested questions
app.get('/api/greeting', async (req, res) => {
  const { model } = req.query;
  const modelType = model || 'llama';

  try {
    // Call Python backend for greeting
    const response = await axios.get(`${PYTHON_BACKEND_URL}/greeting`, {
      params: { model_type: modelType }
    });

    res.json({
      success: true,
      ...response.data
    });
  } catch (error) {

    console.error('Greeting error:', error.message);
    // Fallback greeting with sample questions if backend fails
    const fallbackQuestions = [
      "Can I meet representative from Academic Bureau to consult matters regarding my studies?",
      "What if I missed the deadline for enrollment?",
      "Can I drop the subjects or classes that I have been enrolled in?",
      "Why can't I access my GPA?",
      "Can I change my major?",
      "What if I want to transfer to President University?"
    ];
    
    // Randomly select 4 questions
    const shuffled = fallbackQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    
    res.json({
      success: true,
      greeting: "Hello! I'm Jarvis AI, your friendly assistant for President University! 😊\n\nI can help you with information about the university. Here are some questions you might want to ask:",
      suggested_questions: selected,
      source: modelType === 'gemini' ? 'Gemini 2.5 Flash' : 'Llama 3.2 (Local)'
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model, sessionId } = req.body;

    if (!message || !model) {
      return res.status(400).json({
        success: false,
        error: 'Message and model are required'
      });
    }

    // Validate model exists
    const modelExists = AVAILABLE_MODELS.find(m => m.id === model);
    if (!modelExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model selected'
      });
    }

    // Initialize session if not exists
    const session = sessionId || `session_${Date.now()}`;
    if (!chatHistory[session]) {
      chatHistory[session] = [];
    }

    // Add user message to history
    messageId++;
    const userMessage = {
      id: messageId,
      role: 'user',
      content: message,
      timestamp: new Date(),
      model
    };
    chatHistory[session].push(userMessage);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, model);

    messageId++;
    const assistantMessage = {
      id: messageId,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      model
    };
    chatHistory[session].push(assistantMessage);

    res.json({
      success: true,
      session,
      messages: [userMessage, assistantMessage],
      history: chatHistory[session]
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// Get chat history
app.get('/api/chat-history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = chatHistory[sessionId] || [];

    res.json({
      success: true,
      sessionId,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

// Clear chat history
app.delete('/api/chat-history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    delete chatHistory[sessionId];

    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history'
    });
  }
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
  const sessions = Object.keys(chatHistory).map(sessionId => ({
    sessionId,
    messageCount: chatHistory[sessionId].length,
    lastMessage: chatHistory[sessionId][chatHistory[sessionId].length - 1]?.content || '',
    lastTimestamp: chatHistory[sessionId][chatHistory[sessionId].length - 1]?.timestamp || null
  }));

  res.json({
    success: true,
    sessions
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Server is running',
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ChatBot Backend running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/models - Get available models`);
  console.log(`   POST /api/chat - Send chat message`);
  console.log(`   GET  /api/chat-history/:sessionId - Get chat history`);
  console.log(`   DELETE /api/chat-history/:sessionId - Clear chat history`);
  console.log(`   GET  /api/sessions - Get all sessions`);
});

module.exports = app;
