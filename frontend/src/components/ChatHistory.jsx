import React, { useState, useEffect } from 'react';
import { chatAPI } from '../utils/api';

export const ChatHistory = ({ onSelectSession, currentSessionId, onNewChat }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      if (response.data.success) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    onNewChat(newSessionId);
  };

  const handleDeleteSession = async (sessionId, event) => {
    event.stopPropagation(); // Prevent selecting the session
    setDeleteConfirm(sessionId);
  };

  const confirmDelete = async (sessionId, event) => {
    event.stopPropagation();
    try {
      await chatAPI.clearHistory(sessionId);
      setSessions(sessions.filter(s => s.sessionId !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete conversation');
    }
  };

  const cancelDelete = (event) => {
    event.stopPropagation();
    setDeleteConfirm(null);
  };

  return (
    <div style={{
      width: '260px',
      background: 'linear-gradient(180deg, #0f172a 0%, #1a1f3a 100%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      boxShadow: '2px 0 15px rgba(0, 0, 0, 0.3)'
    }}>
      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        style={{
          margin: '16px 12px',
          padding: '12px 16px',
          background: '#333333',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
          e.target.style.backgroundColor = '#555555';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          e.target.style.backgroundColor = '#333333';
        }}
      >
        <span>➕ New Chat</span>
      </button>

      {/* Chat History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', padding: '12px 8px', fontWeight: '600', letterSpacing: '0.5px' }}>
          CONVERSATIONS
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: '20px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
            No history yet
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.sessionId}
              style={{
                position: 'relative',
                width: '100%',
                marginBottom: '6px'
              }}
            >
              {deleteConfirm === session.sessionId ? (
                // Delete Confirmation Dialog
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#fca5a5'
                }}>
                  <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                    Delete this conversation?
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => confirmDelete(session.sessionId, e)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={cancelDelete}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Session Button with Delete Icon
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <button
                    onClick={() => onSelectSession(session.sessionId)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: currentSessionId === session.sessionId 
                        ? 'linear-gradient(135deg, rgba(16, 163, 127, 0.2) 0%, rgba(16, 163, 127, 0.1) 100%)'
                        : 'transparent',
                      borderLeft: currentSessionId === session.sessionId ? '3px solid #10a37f' : '3px solid transparent',
                      color: currentSessionId === session.sessionId ? '#10a37f' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentSessionId !== session.sessionId) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentSessionId !== session.sessionId) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                    title={session.lastMessage || 'Empty conversation'}
                  >
                    {(() => {
                      const text = session.lastMessage || 'New conversation';
                      return text.length > 28 ? text.substring(0, 28) + '...' : text;
                    })()}
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(session.sessionId, e)}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      color: '#94a3b8',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                      e.target.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#94a3b8';
                    }}
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '11px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        Jarvis AI
      </div>
    </div>
  );
};

export default ChatHistory;
