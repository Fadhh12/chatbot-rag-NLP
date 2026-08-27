import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ModelSwitcher from './ModelSwitcher';
import ChatHistory from './ChatHistory';
import { chatAPI } from '../utils/api';

export const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Load models on component mount
  useEffect(() => {
    loadModels();
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
  }, []);

  // Load greeting when model is selected and no messages
  useEffect(() => {
    if (selectedModel && messages.length === 0 && sessionId) {
      loadGreeting();
    }
  }, [selectedModel, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadModels = async () => {
    try {
      const response = await chatAPI.getModels();
      setModels(response.data.models);
      if (response.data.models.length > 0) {
        setSelectedModel(response.data.models[0].id);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load AI models');
    }
  };

  const loadGreeting = async () => {
    try {
      console.log('Loading greeting for model:', selectedModel);
      const response = await chatAPI.getGreeting(selectedModel);
      console.log('Greeting response:', response.data);
      if (response.data.success) {
        const greetingMessage = {
          id: 'greeting_' + Date.now(),
          role: 'assistant',
          content: response.data.greeting,
          timestamp: new Date(),
          model: selectedModel,
          suggestedQuestions: response.data.suggested_questions
        };
        console.log('Setting greeting message:', greetingMessage);
        setMessages([greetingMessage]);
      }
    } catch (err) {
      console.error('Failed to load greeting:', err);
    }
  };

  const handleQuestionClick = (question) => {
    setInputValue(question);
    // Automatically send the question
    setTimeout(() => {
      handleSendMessage(question);
    }, 100);
  };

  const handleSendMessage = async (messageOverride) => {
    const messageToSend = messageOverride || inputValue.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      model: selectedModel
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Add loading message
    const loadingMessage = {
      id: 'loading',
      role: 'assistant',
      content: 'typing',
      timestamp: new Date(),
      model: selectedModel,
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await chatAPI.sendMessage(
        userMessage.content,
        selectedModel,
        sessionId
      );

      if (response.data.success && response.data.messages) {
        const assistantMessage = response.data.messages[1];
        // Remove loading message and add real response
        setMessages(prev => prev.filter(m => m.id !== 'loading').concat(assistantMessage));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${err.response?.data?.error || 'Failed to get response from AI'}`,
        timestamp: new Date(),
        model: selectedModel
      };
      // Remove loading message and add error
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(errorMessage));
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!sessionId || messages.length === 0) return;

    if (confirm('Are you sure you want to clear all messages?')) {
      try {
        await chatAPI.clearHistory(sessionId);
        setMessages([]);
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
      } catch (err) {
        console.error('Failed to clear chat:', err);
        setError('Failed to clear chat history');
      }
    }
  };

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
  };

  const handleNewChat = (newSessionId) => {
    setSessionId(newSessionId);
    setMessages([]);
    setInputValue('');
    setError(null);
    // Load greeting for new chat
    setTimeout(() => {
      loadGreeting();
    }, 100);
  };

  const handleSelectSession = async (sessionId) => {
    try {
      const response = await chatAPI.getChatHistory(sessionId);
      if (response.data.success) {
        setSessionId(sessionId);
        setMessages(response.data.history);
        setInputValue('');
        setError(null);
        if (window.innerWidth <= 768) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load chat history');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
      
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <ChatHistory 
          onSelectSession={handleSelectSession}
          currentSessionId={sessionId}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, backgroundColor: '#0d0d0d', position: 'relative' }}>

      {/* Header */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
        backgroundColor: '#1a1f3a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Hamburger Menu for Mobile */}
        <button 
          className="menu-button"
          onClick={() => setIsSidebarOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div style={{ fontSize: '24px' }}>🤖</div>
        <div>
          <h1 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#cbd5e1', 
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Jarvis AI
          </h1>
          <p style={{ 
            fontSize: '12px', 
            color: '#64748b', 
            margin: 0,
            marginTop: '2px'
          }}>
            President University Assistant
          </p>
        </div>
      </div>

      {/* Model Switcher */}
      <ModelSwitcher
        models={models}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        isLoading={isLoading}
      />

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', backgroundColor: '#0d0d0d', background: 'linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)', backgroundAttachment: 'fixed' }}>
        {messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666666' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.8 }}>💬</div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px', letterSpacing: '-0.5px' }}>Start a conversation</h2>
            <p style={{ textAlign: 'center', maxWidth: '448px', fontSize: '15px', lineHeight: '1.6', color: '#999999' }}>
              Select an AI model above and ask anything. You can switch models anytime to compare different responses.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
                onQuestionClick={handleQuestionClick}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ margin: '0 24px 16px 24px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px', fontWeight: '500' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        isLoading={isLoading}
      />
      </div>
    </div>
  );
};

export default ChatWindow;
