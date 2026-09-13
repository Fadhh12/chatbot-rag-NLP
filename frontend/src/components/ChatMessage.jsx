import React from 'react';

export const ChatMessage = ({ message, isUser, onQuestionClick }) => {
  const timeStr = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if this is a loading message
  const isLoadingMessage = message.isLoading || message.content === 'typing';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '20px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div style={{
        borderRadius: '16px',
        padding: '14px 16px',
        maxWidth: '560px',
        backgroundColor: isUser 
          ? '#000000' 
          : '#2d2d2d',
        color: 'white',
        wordWrap: 'break-word',
        animation: 'fadeIn 0.3s ease-in-out',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        border: 'none'
      }}>
        {isLoadingMessage ? (
          // Typing indicator animation
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            color: '#94a3b8'
          }}>
            <span>🤖 Jarvis AI is thinking</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ 
                animation: 'bounce 1.4s infinite ease-in-out',
                animationDelay: '0s'
              }}>.</span>
              <span style={{ 
                animation: 'bounce 1.4s infinite ease-in-out',
                animationDelay: '0.2s'
              }}>.</span>
              <span style={{ 
                animation: 'bounce 1.4s infinite ease-in-out',
                animationDelay: '0.4s'
              }}>.</span>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0', fontWeight: '400', whiteSpace: 'pre-wrap' }}>{message.content}</p>
            
            {/* Suggested Questions */}
            {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                {message.suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onQuestionClick && onQuestionClick(question)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      marginTop: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#60a5fa',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    💡 {question}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        
        {!isLoadingMessage && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`, fontSize: '11px', opacity: 0.7 }}>
            <span>{timeStr}</span>
            {isUser ? (
              <span style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                padding: '2px 8px', 
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                You
              </span>
            ) : message.model && (
              <span style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {message.model}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* CSS Animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;
